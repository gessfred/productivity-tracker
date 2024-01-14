## How to test
 
```bash
export DB_CONNECTION_STRING="postgresql://doadmin:${DB_PASSWORD}@db-postgresql-fra1-33436-do-user-6069962-0.b.db.ondigitalocean.com:25060/keylogger"
python3 -m http.server
```