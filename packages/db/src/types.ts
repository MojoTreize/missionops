import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import type * as schema from "./schema";

/**
 * Base de données ou transaction, indépendamment du pilote (postgres-js en
 * production, PGlite dans les tests). Les services applicatifs ne dépendent que
 * de ce type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<PgQueryResultHKT, typeof schema, any>;
