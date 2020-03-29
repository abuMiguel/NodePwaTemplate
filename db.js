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
        const userSql = `select employeeId, firstName, lastName, email, admin from employee where email = '${email}' COLLATE NOCASE`;
        return this.getAsync(userSql);
    },
    getEmployeeByIdAsync: function (id) {
        const getEmployeeSql = `select employeeId, firstName, lastName, email, admin from employee where employeeId = ${id}`;
        return this.getAsync(getEmployeeSql);
    },
    getEmployeePasswordAsync: function (email) {
        const getEmployeePasswordSql = `select password from employee where email = '${email}' COLLATE NOCASE`;
        return this.getAsync(getEmployeePasswordSql);
    },
    getEmployeeProfileAsync: function (id) {
        const getEmployeeProfileSql = "select employeeId, firstName, lastName, email, shirtSize, cellPhone, " +
            "emergencyContactName, emergencyContactNumber " + `from employee where employeeId = ${id}`;
        return this.getAsync(getEmployeeProfileSql);
    },
    getAllEmployeesAsync: function () {
        const getAllEmployeeIdsSql = "select employeeId, firstName, lastName, highestDegree from employee";
        return this.eachAsync(getAllEmployeeIdsSql);
    },
    getEmployeesAsync: function () {
        const selectAllEmployeesSql = "select employeeId, firstName, middleName, lastName from employee";
        return this.eachAsync(selectAllEmployeesSql);
    },
    insertEmployeeAsync: function (emp) {
        const insertEmployeeSql =
            `insert into employee(firstName, middleName, lastName) VALUES('${emp.firstName}','${emp.middleName}','${emp.lastName}')`;
        return this.insertAsync(insertEmployeeSql);
    },
    insertNewEmployeeAsync: function (email, password) {
        const insertNewEmployeeSql =
            `insert into employee(email, password) VALUES('${email}','${password}')`;
        return this.insertAsync(insertNewEmployeeSql);
    },
    updateEmployeeWithExistingId: function (id, password) {
        const insertExistingEmployeeSql =
            `update employee set password = '${password}' where employeeId = ${id}`;
        return this.insertAsync(insertExistingEmployeeSql);
    },
    employeeExistsAsync: function (emp) {
        let getEmployeeIdByName = `select employeeId from employee where firstName='${emp.firstName}' COLLATE NOCASE and lastName='${emp.lastName}' COLLATE NOCASE`;
        return this.getAsync(getEmployeeIdByName);
    },
    employeeAccountExistsAsync: function (email) {
        let getEmployeeIdByEmail = `select employeeId, password from employee where email='${email}' COLLATE NOCASE`;
        return this.getAsync(getEmployeeIdByEmail);
    },
    getOrInsertEmployeeAsync: async function (names) {
        let employeeId = 0;
        try {
            let result = await this.employeeExistsAsync(names);
            if (!result) {
                await this.insertEmployeeAsync(names);
                result = await this.employeeExistsAsync(names);
            }
            if (result)
                employeeId = result.employeeId;
        }
        catch (e) {
            console.log(e.message);
        }
        return employeeId;
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