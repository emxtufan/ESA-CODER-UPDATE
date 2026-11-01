# WORKER — fișă de referință (doar semnături)

## Convenții
- Listare `GET /res` → `{items,total,page,pageSize}` (`total` = total filtrat); POST/PATCH → `{item}`; DELETE → 204; eroare → `{error:{code,message,fields?}}`
- Bani = minor units (int, `moneyInt`); UI afișează `formatMoney(minor)`, formular trimite `Math.round(x*100)`
- Importuri: server relativ (`../../lib/crud`), client `@/…`, comun `@shared` (sau relativ `../../../shared/…` pe server)
- Pagină = fișier cu `export default`; înregistrare: `client/src/app/router.tsx` (`lazy(() => import("@/modules/x/XPage"))` în `children` sub `RequireAuth`) + item în `NAV` din `client/src/app/nav.ts` (`{label,to,icon,perm?}`)
- Căutare globală = intrare nouă în `GROUPS` din `server/modules/search/routes.ts` (`{key,label,perm,table,columns,title(row),subtitle(row),link(row)}`)
- Rută modul: sub-rute proprii ÎNAINTE de `router.use(crudRouter({…}))`; zod fără `.default()` (`.optional()`/`.nullable()`, `<input>` gol → `""` → preprocess la `null`)
- react-router (nu -dom); `api` e funcție, nu `api.post`; `DataTable` coloane `{key,header,render?}`; `ResourcePage` primește config-ul ca props directe; toate căile încep cu `management/`

## UI (`@/components/ui` — se importă doar din index)
- `Badge {tone?: "neutral"|"success"|"warning"|"danger"|"info"; children; className?}`
- `Breadcrumbs {items: BreadcrumbItem[]; className?}`; `BreadcrumbItem {label: string; href?: string}`
- `Button {variant?: "primary"|"secondary"|"ghost"|"danger"; size?: "sm"|"md"; loading?: boolean; className?; …button props}`
- `Card {title?: ReactNode; description?: ReactNode; actions?: ReactNode; children?; className?; bodyClassName?}`
- `Checkbox {label?: ReactNode; className?; …input props fără type}`
- `ConfirmDialog {open; title; message; confirmLabel?; danger?; loading?; onConfirm(); onCancel()}`
- `DataTable<T> {columns: DataTableColumn<T>[]; rows: T[]; rowKey: keyof T|((row)=>string|number); sort?: {key,dir:"asc"|"desc"}; onSort?(key); onRowClick?(row); loading?; error?: unknown; onRetry?(); empty?: ReactNode; className?}`
- `DataTableColumn<T> {key: string; header: ReactNode; render?(row): ReactNode; sortable?; align?: "left"|"center"|"right"; hideOnMobile?}`
- `EmptyState {icon?: LucideIcon; title: string; description?; action?: ReactNode; className?}`
- `ErrorState {error: unknown; onRetry?(); title?; className?}`
- `Field {label: string; htmlFor?; error?; hint?; required?; className?; children}`
- `Input {invalid?: boolean; className?; …input props}`; `Textarea {invalid?; …textarea props}`
- `Modal {open; onClose(); title: string; footer?: ReactNode; children?; className?}`
- `PageHeader {title; description?; actions?: ReactNode; breadcrumbs?: BreadcrumbItem[]; className?}`
- `Pagination {page; pageSize; total; onPage(page); className?}`
- `Select {options: {value,label}[]; placeholder?; invalid?; className?; …select props}`; `SelectOption {value: string; label: string}`
- `Skeleton {className?}`; `Spinner` (fără props); `Tabs {items: {value,label}[]; value; onChange(value); className?}`
- `useToast() → {success(msg), error(msg)}` (necesită `ToastProvider`); `cn(...)`; `BadgeTone`

## ResourcePage (`@/components/resource/ResourcePage.tsx`)
- `ResourcePageConfig<T> {title; description?; endpoint; perm; columns: DataTableColumn<T>[]; fields: FieldDef[]; filters?: FilterDef[]; searchPlaceholder?; detailPath?(row): string; defaults?: Record<string,unknown>; extraQuery?: Record<string,string|number>; embedded?; canDelete?; rowActions?(row): ReactNode; itemName}`
- `FilterDef {name; label; options?: readonly FieldOption[]; endpoint?; labelKey?}`
- `perm` = modul de permisiuni (`"clients"` → `.view/.create/.update/.delete`); fără `detailPath` click pe rând = edit; cu `detailPath` = navigare

## fields.tsx (`@/components/resource/fields`)
- `FieldType = "text"|"textarea"|"number"|"money"|"date"|"datetime"|"select"|"checkbox"|"email"|"url"|"relation"|"tags"|"password"`
- `FieldOption = string | {value: string; label: string}`
- `FieldDef {name; label; type: FieldType; options?: readonly FieldOption[]; endpoint?; labelKey?; required?; hint?; span?: 1|2; showIf?(values: Record<string,unknown>): boolean; omitOnEdit?}`
- `normalizeOptions(options?): SelectOption[]`
- `useRelationOptions(endpoint?, labelKey = "name"): {options: SelectOption[]; loading: boolean}` — `GET endpoint?pageSize=100`
- `resourceDefaults(fields: FieldDef[], row: Record<string,unknown>|null, defaults?): Record<string,unknown>`
- `formValuesToBody(fields: FieldDef[], values: Record<string,unknown>, editing: boolean): Record<string,unknown>`
- `ResourceFormField({field: FieldDef; form: UseFormReturn<FieldValues>})`
- `formatMoney(minor: number|null|undefined, currency = "RON"): string` (`minor/100`, ro-RO, `—` dacă lipsește)
- `formatDate(value: string|number|Date|null|undefined): string` (ro-RO, `—` dacă lipsește/invalid)
- `statusTone(status?: string|null): BadgeTone` — success: completed/paid/successful/active; danger: failed/overdue/suspended/blocked; info: pending/review/`in*`

## Client lib
- `api<T>(path, {method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"; body?; query?: Record<string,QueryValue>; signal?}): Promise<T>` — prefix `/api`, header `x-requested-with: esa`, 204 → `undefined`
- `ApiError {status; code; fields?: Record<string,string>}`; `qs(query?): string` (sare peste `null`/`undefined`/`""`)
- `useMe(): Me|null` (query `["me"]`, 401 → null); `useCan(perm?): boolean` (super_admin = true); `RequireAuth {children}`
- `Me {user: {id; email; name; role; totpEnabled}; permissions: string[]}`
- `useListParams(defaults?: {pageSize?; sort?; dir?}) → {page, pageSize, q, qInput, setQ, sort, dir, filters, setPage, setPageSize, setSort, setDir, setFilter, query}`
- Chei rezervate (nu ajung în `filters`/`query`): `page, pageSize, q, sort, dir, tab, view`; `q` scris în URL după 300ms; `pageSize` implicit 25

## Server
- `crudRouter(cfg: CrudConfig): Router` → `GET /` (listare) | `GET /:id` → `{item}` | `POST /` → 201 `{item}` | `PATCH /:id` → `{item}` | `DELETE /:id` → 204
- `CrudConfig {table; entityType: string; permission: PermissionModule|{view,create,update,delete}; schema: ZodObject; updateSchema?; searchColumns: PgColumn[]; filters?: Record<string,PgColumn>; sortable: Record<string,PgColumn>; defaultSort?: {column; dir?}; softDelete?; scope?(req): SQL|undefined; toRow?(data,req); fromRow?(row,req); listTransform?(rows,req); afterCreate?; afterUpdate?(row,req,before); afterDelete?; beforeDelete?; sensitiveFields?: string[]}`
- Filtre: `eq`, sau `inArray` pentru valori CSV; `q` doar pe `searchColumns`; sortare doar din `sortable`; id invalid → 422, absent/în afara `scope` → 404; FK/unic → 409
- Helperi crud: `dateStr` (""→null), `optStr` (trim, ""→null), `moneyInt` (coerce int ≥ 0)
- http: `HttpError(status, code, message, fields?)`; `parse(schema, data)` → 422 `{code:"validation_error"}`; `errorHandler`; `pageQuery {page=1, pageSize=25 ≤100, q?, sort?, dir?}`; `Paged<T> {items,total,page,pageSize}`; `paged(items, total, q)`
- guards: `requireAuth`, `allowMfaPending`, `can(req, perm)`, `requirePermission(...perms)` (403 `forbidden`), `csrfGuard` (metode nesigure: `x-requested-with: esa` + `Origin` pe hostul aplicației)
- audit: `audit(req, action, entityType, entityId, meta?)` → `audit_logs` (redact `/password|secret|token|key/i`); `recordActivity(db, ActivityInput)` → `activities` (`projectId?`, `clientId?`, `actorId?`, `actorLabel?`, `type`, `description`, `entityType?`, `entityId?`); `redact(meta)`
- `shared/enums.ts` (nume liste; fiecare cu tip derivat): `PROJECT_TYPES`, `PROJECT_STATUSES`, `CLIENT_STATUSES` (`["Prospect","Active","Inactive"]`), `PRIORITIES`, `TASK_STATUSES`, `SERVER_PROVIDERS`, `SERVER_TYPES`, `SERVICE_NAMES`, `CREDENTIAL_TYPES`, `DEPLOYMENT_STATUSES`, `INVOICE_STATUSES`, `EXPENSE_CATEGORIES`, `DOCUMENT_TYPES`, `NOTIFICATION_EVENTS`, `MAINTENANCE_PLANS`, `MAINTENANCE_ACTIVITIES`, `ROLES`+`ROLE_LABELS`, `CURRENCIES`, `PASSWORD_TOKEN_KINDS`

## Model rută (`server/modules/projects/routes.ts`, scurt)
- `projectsRouter(): Router` — sub-rute (`GET /favorites/mine`, `POST|DELETE /:id/favorite`) apoi `router.use(crudRouter({table: projects, entityType: "project", permission: "projects", schema: projectSchema, searchColumns, filters: {status,type,clientId,priority}, sortable, defaultSort: {column: createdAt, dir: "desc"}, toRow (slug la POST), listTransform (clientName), afterCreate/afterUpdate → recordActivity}))`

## tests/helpers.ts
- `setup() → {url, db, env, api(path, {method?, body?, cookie?}), makeUser(role, {password?}), loginAs(user) → cookie, close()}`; `TEST_PASSWORD`; `TestUser`, `TestDb`, `Setup`
- `api` întoarce `{status, json, setCookie}` (header CSRF + JSON deja puse); PGlite `memory: true`, app reală pe port efemer
