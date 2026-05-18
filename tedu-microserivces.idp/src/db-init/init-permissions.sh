#!/usr/bin/env bash
set -euo pipefail

server="teduidentitydb"
user="sa"
password="Passw0rd!"
database="TeduIdentity"

until /opt/mssql-tools/bin/sqlcmd -S "$server" -U "$user" -P "$password" -Q "SELECT 1" >/dev/null 2>&1; do
  echo "Waiting for SQL Server to accept connections..."
  sleep 2
done

/opt/mssql-tools/bin/sqlcmd -S "$server" -U "$user" -P "$password" -Q "IF DB_ID('$database') IS NULL CREATE DATABASE [$database];"

until /opt/mssql-tools/bin/sqlcmd -S "$server" -U "$user" -P "$password" -d "$database" -Q "IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Identity') AND EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Identity' AND t.name = 'Permissions') SELECT 1 ELSE SELECT 0" -h -1 -W | grep -q "1"; do
  echo "Waiting for Identity.Permissions table (migrations)..."
  sleep 2
done

for script in \
  Get_Permission_ByRoleId.sql \
  Create_Permission.sql \
  Delete_Permission.sql \
  Update_Permissions_ByRole.sql; do
  echo "Running $script"
  /opt/mssql-tools/bin/sqlcmd -S "$server" -U "$user" -P "$password" -d "$database" -i "/scripts/$script"
done

echo "Permission stored procedures installed."
