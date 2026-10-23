// node tests/analytics-check.mjs — source attribution, visits/views and the summary of server/analytics.mjs
import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {countryOf, createAnalytics, sourceOf} from '../server/analytics.mjs';

assert.equal(sourceOf('', ''), 'direct');
assert.equal(sourceOf('', 'google.com'), 'search');
assert.equal(sourceOf('', 'l.facebook.com'), 'facebook');
assert.equal(sourceOf('FB', ''), 'facebook');
assert.equal(sourceOf('newsletter', 'google.com'), 'email'); // utm wins over the referrer
assert.equal(sourceOf('', 'dribbble.com'), 'dribbble.com');
assert.equal(countryOf({'cf-ipcountry': 'de'}, 'ro-RO'), 'DE');
assert.equal(countryOf({}, 'ro-RO'), 'RO');
assert.equal(countryOf({}, 'en'), '');
assert.equal(countryOf({}, 'en-US', 'Europe/Bucharest'), 'RO'); // the time zone wins over an English browser
assert.equal(countryOf({'cf-ipcountry': 'DE'}, 'en-US', 'Europe/Bucharest'), 'DE');
assert.equal(countryOf({}, 'en-GB', 'Nowhere/Zone'), 'GB');

const file = path.join(mkdtempSync(path.join(tmpdir(), 'vv-analytics-')), 'a.json');
const a = createAnalytics(file);
const headers = {'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1', host: 'site.ro'};
a.record({type: 'visit', sid: 's1', path: '/', source: 'facebook', medium: 'paid_social', campaign: 'Oferta', content: 'video-1', device: 'mobile', lang: 'ro-RO', tz: 'Europe/Bucharest', screen: '390x844'}, {headers, ip: '::ffff:86.120.1.2'});
a.record({type: 'visit', sid: 's1', path: '/'}, {headers}); // repeated visit beacon: ignored
a.record({type: 'view', sid: 's1', path: '/works'}, {headers});
a.record({type: 'view', sid: 's1', path: '/contact'}, {headers});
a.record({type: 'visit', sid: 's2', path: '/blog', referrer: 'https://www.google.com/', gclid: true}, {headers: {...headers, 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36'}, ip: '86.120.1.2'});
a.record({type: 'visit', sid: 's3', path: '/'}, {headers: {'user-agent': 'Googlebot/2.1'}}); // bot: ignored
a.record({type: 'visit', sid: 's4', path: '/admin'}, {headers}); // admin: ignored

const s = a.summary(30);
assert.equal(s.totals.range, 2);
assert.equal(s.totals.views, 4);
assert.deepEqual(s.sources.map((r) => r.key).sort(), ['facebook', 'google ads']); // gclid = Google Ads click, not organic search
assert.equal(s.campaigns[0].key, 'oferta');
assert.equal(s.campaignDetails[0].key, 'facebook · paid_social · oferta');
const v1 = s.recent.find((v) => v.sid === 's1');
assert.deepEqual(v1.views.map((v) => v.path), ['/', '/works', '/contact']);
assert.equal(v1.os, 'iOS');
assert.equal(v1.country, 'RO');
assert.equal(s.recent.find((v) => v.sid === 's2').referrer, 'google.com');
assert.equal(s.online, 2);
assert.equal(v1.ip, '86.120.1.2');
assert.equal(v1.screen, '390x844');
assert.equal(s.hours.length, 24);
assert.equal(s.hours.reduce((a, b) => a + b, 0), 2);
assert.equal(s.weekdays.reduce((a, b) => a + b, 0), 2);
assert.deepEqual(s.ips.map((e) => [e.ip, e.visits, e.views]), [['86.120.1.2', 2, 4]]);
assert.equal(s.engagement.returning, 1); // second visit from the same IP
assert.equal(s.engagement.bounceRate, 0.5); // s2 saw one page
assert.deepEqual(s.exits.map((e) => e.key).sort(), ['/blog', '/contact']);

await a.flush();
assert.equal(JSON.parse(readFileSync(file, 'utf8')).totals.visits, 2);
assert.equal(createAnalytics(file).summary(30).totals.range, 2); // survives a restart
await Promise.all([a.flush(), a.remove('s1'), a.flush()]);
assert.deepEqual(a.summary(30).recent.map(v => v.sid), ['s2']);
assert.deepEqual(a.summary(30).daily, s.daily); // only details are deleted
assert.deepEqual(createAnalytics(file).summary(30).recent.map(v => v.sid), ['s2']);
assert.equal(await a.remove('unknown'), false);

await Promise.all([a.flush(), a.clear(), a.flush()]);
const cleared = createAnalytics(file).summary(30);
assert.equal(cleared.totals.allTime, 0);
assert.equal(cleared.totals.views, 0);
assert.deepEqual(cleared.recent, []);
assert.deepEqual(cleared.ips, []);
assert.deepEqual(cleared.sources, []);
assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).days, {});
a.record({type: 'visit', sid: 'after-reset', path: '/'}, {headers});
await a.flush();
assert.equal(createAnalytics(file).summary(30).totals.allTime, 1);

// Failed writes leave the in-memory records intact, and a later retry can succeed.
const blocked = path.join(path.dirname(file), 'blocked');
writeFileSync(blocked, 'not a directory');
const broken = createAnalytics(path.join(blocked, 'a.json'));
broken.record({type: 'visit', sid: 'keep-me', path: '/'}, {headers});
await assert.rejects(broken.remove('keep-me'));
await assert.rejects(broken.clear());
assert.equal(broken.summary(30).recent[0].sid, 'keep-me');
assert.equal(broken.summary(30).totals.allTime, 1);
await assert.rejects(broken.flush());
unlinkSync(blocked);
mkdirSync(blocked);
assert.equal(await broken.remove('keep-me'), true);
assert.deepEqual(createAnalytics(path.join(blocked, 'a.json')).summary(30).recent, []);
console.log('analytics: ok');
process.exit(0);
