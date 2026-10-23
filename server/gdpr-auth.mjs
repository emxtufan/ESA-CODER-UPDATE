import {createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {clean, problem, required} from './gdpr-storage.mjs';
const scrypt = promisify(scryptCallback);
const cookieName = 'esa_gdpr';
const roles = ['gdpr_admin', 'auditor'];
const constant = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export async function passwordHash(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 256) throw problem('Parola trebuie să aibă între 14 și 256 de caractere.');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
async function matches(password, saved) {
  const [salt, expected] = saved.split(':');
  return constant((await scrypt(String(password || '').slice(0, 256), salt, 64)).toString('hex'), expected);
}
function decodeBase32(value) {
  let bits = '';
  for (const c of value) bits += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5, '0');
  return Buffer.from(bits.match(/.{8}/g).map(v => parseInt(v, 2)));
}
export function totp(secret, time = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest.at(-1) & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
function validOtp(secret, code) {
  return /^\d{6}$/.test(String(code)) && [-30000, 0, 30000].some(offset => constant(totp(secret, Date.now() + offset), String(code)));
}

export function gdprAuth({transaction, view, isProd, adminAccess}) {
  const sessions = new Map();
  const cookie = (res, token, age) => res.cookie(cookieName, token, {httpOnly: true, sameSite: 'strict', secure: isProd, path: '/api/admin', maxAge: age});
  const tokenOf = req => (req.headers.cookie || '').split(/;\s*/).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  const parentSession = req => createHash('sha256').update(adminAccess(req) ? (req.headers.cookie || '').split(/;\s*/).find(v => v.startsWith('vv_admin=')) || '' : '').digest('hex');
  async function identity(req) {
    const token = tokenOf(req), session = sessions.get(token);
    if (!session || session.expires <= Date.now() || session.parent !== parentSession(req)) { sessions.delete(token); return null; }
    const user = (await view()).users.find(u => u.id === session.id);
    if (!user?.enabled || user.version !== session.version) { sessions.delete(token); return null; }
    return {id: user.id, name: user.name, role: user.role, mfa: !!user.totp};
  }
  const guard = (write = false) => async (req, res, next) => {
    try {
      const actor = await identity(req);
      if (!actor) return res.status(403).json({ok: false, error: 'Autentifică-te în GDPR & Compliance pentru această operațiune.'});
      if (write && actor.role !== 'gdpr_admin') return res.status(403).json({ok: false, error: 'Rolul auditor permite numai consultarea rapoartelor.'});
      req.gdprActor = actor;
      next();
    } catch (error) { next(error); }
  };
  async function createUser(data, input) {
    const name = required(input.name, 'numele responsabilului', 100);
    const id = required(input.id, 'identificatorul contului', 60).toLowerCase();
    if (!/^[a-z0-9._-]{3,60}$/.test(id) || data.users.some(u => u.id === id)) throw problem('Identificator invalid sau deja utilizat.');
    if (!roles.includes(input.role)) throw problem('Rol necunoscut.');
    const user = {id, name, role: input.role, password: await passwordHash(input.password), enabled: true, version: 1, createdAt: new Date().toISOString()};
    data.users.push(user);
    return user;
  }
  function mount(router, limit) {
    router.get('/access', async (req, res) => res.json({ok: true, bootstrap: !(await view()).users.length, canBootstrap: adminAccess(req), actor: await identity(req)}));
    router.post('/bootstrap', async (req, res) => {
      if (!adminAccess(req)) throw problem('Configurarea inițială necesită autentificarea administratorului website-ului.', 403);
      await transaction('bootstrap', async data => {
        if (data.users.length) throw problem('Accesul inițial a fost deja configurat.', 409);
        await createUser(data, {...req.body, role: 'gdpr_admin'});
      });
      res.json({ok: true});
    });
    router.post('/login', async (req, res) => {
      if (!limit(req.ip)) throw problem('Prea multe încercări. Reîncearcă peste 15 minute.', 429);
      const id = clean(req.body.id, 60).toLowerCase();
      const user = (await view()).users.find(u => u.id === id);
      if (!user?.enabled || !(await matches(req.body.password, user.password)) || (user.totp && !validOtp(user.totp, req.body.code))) {
        throw problem('Date de autentificare sau cod MFA incorecte.', 401);
      }
      await transaction(user.id, data => { data.users.find(u => u.id === user.id).lastLogin = new Date().toISOString(); }, 'LOGIN');
      for (const [key, entry] of sessions) if (entry.expires <= Date.now()) sessions.delete(key);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, {id: user.id, version: user.version, parent: parentSession(req), expires: Date.now() + 3600000});
      cookie(res, token, 3600000);
      res.json({ok: true});
    });
    router.post('/logout', (req, res) => { sessions.delete(tokenOf(req)); cookie(res, '', 0); res.json({ok: true}); });
    router.post('/users', guard(true), async (req, res) => {
      await transaction(req.gdprActor.id, data => createUser(data, req.body), 'USER_CREATED');
      res.json({ok: true});
    });
    router.patch('/users/:id', guard(true), async (req, res) => {
      await transaction(req.gdprActor.id, async data => {
        const user = data.users.find(u => u.id === req.params.id);
        if (!user) throw problem('Cont inexistent.', 404);
        if (req.body.enabled === false || (req.body.role && req.body.role !== 'gdpr_admin')) {
          if (user.role === 'gdpr_admin' && !data.users.some(u => u.id !== user.id && u.enabled && u.role === 'gdpr_admin')) throw problem('Păstrează cel puțin un responsabil GDPR activ.');
        }
        if (typeof req.body.enabled === 'boolean') user.enabled = req.body.enabled;
        if (req.body.role !== undefined) { if (!roles.includes(req.body.role)) throw problem('Rol necunoscut.'); user.role = req.body.role; }
        if (req.body.password) user.password = await passwordHash(req.body.password);
        user.version++;
      }, 'USER_UPDATED');
      res.json({ok: true});
    });
    router.post('/mfa', guard(), async (req, res) => {
      const secret = clean(req.body.secret, 64).toUpperCase();
      if (!/^[A-Z2-7]{32}$/.test(secret) || !validOtp(secret, req.body.code)) throw problem('Secret Base32 sau cod MFA incorect. Folosește un secret aleator de 32 caractere.');
      await transaction(req.gdprActor.id, data => {
        const user = data.users.find(u => u.id === req.gdprActor.id);
        if (user.totp && !validOtp(user.totp, req.body.currentCode)) throw problem('Confirmă și codul MFA curent.');
        user.totp = secret; user.version++;
      }, 'MFA_ENABLED');
      res.json({ok: true});
    });
  }
  return {guard, identity, mount};
}
