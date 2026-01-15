# Migration from SQLite to PostgreSQL on Fly.io

This guide outlines the steps to migrate your application from using SQLite to PostgreSQL on Fly.io.

## Prerequisites

- You have the `flyctl` CLI installed and authenticated.
- You have made the code changes to `prisma/schema.prisma` to use `postgresql` provider (this is already done in the codebase).

## Important: Resetting Migrations

Because you are switching from SQLite to PostgreSQL, your existing migration files (in `prisma/migrations`) are likely incompatible (they contain SQLite-specific SQL). You must reset your migrations **before deploying**.

1.  **Delete the existing migrations folder:**
    Remove the `prisma/migrations` folder from your project.

2.  **Generate new PostgreSQL migrations:**
    You need to generate a new initial migration for PostgreSQL. You will need a running PostgreSQL database for this (either locally or using Docker).

    Update your `.env` file to point `DATABASE_URL` to your local PostgreSQL instance, then run:

    ```bash
    npx prisma migrate dev --name init
    ```

    This will create a new SQL migration file in `prisma/migrations` compatible with PostgreSQL. Commit this new folder to your git repository.

## Deployment Steps

### 1. Create a PostgreSQL Database on Fly.io

Run the following command to create a new Postgres cluster. You can adjust the name and region as needed.

```bash
fly postgres create
```

Follow the prompts to select configuration (e.g., Development/Production, Region, VM size).

### 2. Attach the Database to Your App

Attach the newly created Postgres cluster to your application. This will automatically set the `DATABASE_URL` environment variable in your app.

Replace `<app-name>` with your application name (e.g., `pet-matcher-prod`) and `<postgres-app-name>` with the name of the Postgres app you created in step 1.

```bash
fly postgres attach <postgres-app-name> --app <app-name>
```

### 3. Deploy the Changes

Deploy the updated application code which includes the Prisma schema changes and the new migration files.

```bash
fly deploy
```

During the deployment, the `docker-start` script defined in `package.json` will run:
```bash
npm run setup && npm run start
```
where `setup` runs `prisma generate && prisma migrate deploy`. This will automatically apply the new database migrations to your PostgreSQL database.

### 4. Verify

Check the logs to ensure the application started correctly and connected to the database.

```bash
fly logs -a <app-name>
```

## Data Migration (Optional)

If you need to migrate existing data from your SQLite database to PostgreSQL, you will need to:
1.  Download the `dev.sqlite` file from your volume (if you were persisting it) or local machine.
2.  Use a tool or script to dump the SQLite data and import it into PostgreSQL. Tools like `pgloader` can be helpful.
3.  Since we are live, if the data is critical, ensure you have a backup before switching.

*Note: The current application setup starts with a fresh database structure on Postgres. Existing data in SQLite will not be automatically transferred.*
