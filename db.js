var sqlite3 = require('sqlite3').verbose();
const dbPath = './mydb.db';

module.exports = {
    getAsync: function (sql) {
        var db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        return new Promise(function (resolve, reject) {
            db.get(sql, function (err, row) {
                if (err)
                    reject(err);
                else {
                    resolve(row);
                    db.close();
                }
            });
        });
    },
    insertAsync: function (sql) {
        try {
            var db = new sqlite3.Database(dbPath,
                (err) => {
                    if (err) {
                        throw (err);
                    }
                });
        }
        catch (e) {
            throw (e);
        }

        return new Promise(function (resolve, reject) {
            db.get(sql, function (err) {
                if (err)
                    reject(err);
                else {
                    resolve();
                    db.close();
                }
            });
        });
    },
    eachAsync: function (sql) {
        var db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        let results = [];
        return new Promise(function (resolve, reject) {
            db.each(sql, function (err, row) {
                if (err)
                    reject(err);
                else {
                    results.push(row);
                }
            },
                () => {
                    db.close();
                    resolve(results);
                });
        });
    },
    getAuthenticatedUserAsync: function (email) {
        const userSql = `select userId, firstName, lastName, email, admin from user where email = '${email}' COLLATE NOCASE`;
        return this.getAsync(userSql);
    },
    getUserByIdAsync: function (id) {
        const getUserSql = `select userId, firstName, lastName, email, admin from user where userId = ${id}`;
        return this.getAsync(getUserSql);
    },
    getUserPasswordAsync: function (email) {
        const getUserPasswordSql = `select password from user where email = '${email}' COLLATE NOCASE`;
        return this.getAsync(getUserPasswordSql);
    },
    insertUserAsync: function (emp) {
        const insertUserSql =
            `insert into user(firstName, middleName, lastName) VALUES('${emp.firstName}','${emp.middleName}','${emp.lastName}')`;
        return this.insertAsync(insertUserSql);
    },
    insertNewUserAsync: function (email, password) {
        const insertNewUserSql =
            `insert into user(email, password) VALUES('${email}','${password}')`;
        return this.insertAsync(insertNewUserSql);
    },
    updateUserWithExistingId: function (id, password) {
        const insertExistingUserSql =
            `update user set password = '${password}' where userId = ${id}`;
        return this.insertAsync(insertExistingUserSql);
    },
    userAccountExistsAsync: function (email) {
        let getUserIdByEmail = `select userId, password from user where email='${email}' COLLATE NOCASE`;
        return this.getAsync(getUserIdByEmail);
    },
    getOrInsertUserAsync: async function (names) {
        let userId = 0;
        try {
            let result = await this.userExistsAsync(names);
            if (!result) {
                await this.insertUserAsync(names);
                result = await this.userExistsAsync(names);
            }
            if (result)
                userId = result.userId;
        }
        catch (e) {
            console.log(e.message);
        }
        return userId;
    },
    insertErrorAsync: function (stack, userId, username) {
        let insertErrorSql =
            `insert into error(userId, stack, username) VALUES(${userId},'${stack}','${username}')`;
        return this.insertAsync(insertErrorSql);
    },
    updateAppEmailAsync: function (email, password, from) {
        let updateEmailSql =
            `update config set email=${email},emailPassword=${password},emailFrom=${from})`;
        return this.insertAsync(updateEmailSql);
    },
    getAppEmailAsync: function () {
        let getAppEmailSql =
            `select email, emailPassword, emailFrom from config limit 1`;
        return this.getAsync(getAppEmailSql);
    },
    getTemplateAsync: function (name) {
        let getTemplateSql = `select templateId, templateName, subject, message, html from template ` +
            `where templateName = '${name}' COLLATE NOCASE`;
        return this.getAsync(getTemplateSql);
    },
    getPhraseAsync: async function () {
        let getPhraseSql = 'select phrase from config limit 1';
        return await this.getAsync(getPhraseSql);
    }
};
