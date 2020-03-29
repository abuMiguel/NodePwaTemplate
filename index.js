const express = require('express')
const fs = require('fs')
const multer = require('multer')
const util = require('./util')
const db = require('./db')
const path = require('path')
const session = require('express-session')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const app = express()
const _ = require('lodash')

const port = 3000
const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, "views"));
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(flash());
//TODO: UPDATE SESSION SECRET
app.use(session({ secret: "cats", saveUninitialized: false, resave: false }));
app.use(passport.initialize());
app.use(passport.session());


let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './resumes')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

let upload = multer({ storage: storage });
let phraseCache = db.getPhraseAsync()
    .then(p => {
        return p.phrase;
    })
    .catch(err => {
        next(err);
    });

passport.use(new LocalStrategy(
    async function (username, password, done) {
        try {
            if (username && username.indexOf('@') > 0) {
                username = username.substring(0, username.indexOf('@'));
            }
            let user = await db.getEmployeePasswordAsync(username);
            if (!user) {
                return done(null, false, { message: 'Username does not exist.' });
            }

            if (!user.password) {
                return done(null, false, { message: 'No password established for user.' });
            }

            let pwd = user.password;
            let phrase = await phraseCache;
            let decrypted = util.decrypt(pwd, phrase);
            if (decrypted === password) {
                let user = await db.getAuthenticatedUserAsync(username);
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        }
        catch (err) {
            return done(err, false, { message: 'Cannot verify identity.' });
        }
    }
));

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    session: true,
    failureFlash: true
}));

passport.serializeUser(function (user, done) {
    done(null, user.employeeId);
});

passport.deserializeUser(async function (id, done) {
    try {
        let user = await db.getEmployeeByIdAsync(id);
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    try {
        let fl = req.flash();
        let message = null;
        if (fl && fl.error) {
            message = fl.error[0];
        }
        res.render('login', { message: message });
    }
    catch (e) {
        res.render('login');
    }
});

app.get('/login.html', isLoggedIn, function (req, res) {
    res.redirect(302, '/');
});

app.get('/logout', function (req, res, next) {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                next(err);
            }
            return res.redirect(302, 'login.html');
        });
    }
});

app.get('/', function (req, res) {
    if (req && req.user) {
        res.render('index', {});
    }
    else {
        res.redirect(302, 'login.html');
    }
});

app.post('/register', async function (req, res, next) {
    try {
        if (!req.body || !req.body.email) {
            // Did not enter an email address at all
            res.render('register', {
                errorMessage: 'You must enter your full email address.'
            });
            return;
        }

        if (req.session) {
            req.session.destroy(function (err) {
                if (err) {
                    throw (err);
                }
            });
        }

        let email = req.body.email;
        let username = email;
        if (username && username.indexOf('@') > 0) {
            username = username.substring(0, username.indexOf('@'));
        }

        let user = await db.employeeAccountExistsAsync(username);
        let employeeId = null;
        if (user && user.password) {
            res.render('register', {
                errorMessage: 'An account already exists for this user.'
            });
            return;
        }
        if (user && user.employeeId) {
            employeeId = user.employeeId;
        }

        let from = await db.getAppEmailAsync();
        let template = await db.getTemplateAsync('registration');
        let subject = template && template.subject ? template.subject : '';
        let message = template && template.message ? template.message : '';

        let pwd = Math.random().toString(36).substr(2, 8);
        let phrase = await phraseCache;
        let encrypted = util.encrypt(pwd, phrase);

        if (employeeId == null) {
            await db.insertNewEmployeeAsync(username, encrypted);
        } else {
            await db.updateEmployeeWithExistingId(employeeId, encrypted);
        }
        message = message.replace('#username', username);
        message = message.replace('#password', pwd);
        message = message.replace('#link', req.headers.host);

        let html = template && template.html ? template.html : '';
        if (html) {
            html = html.replace('#username', username);
            html = html.replace('#password', pwd);
            html = html.replace('#link', req.headers.host);
        }
        let recipients = email;
        let emailResponse = await util.sendEmailAsync(from.emailFrom, from.email,
            from.emailPassword, recipients, message, subject, html);
        let status = emailResponse === "success" ? 200 : 500;

        if (status === 200) {
            res.render('register', {
                successMessage: 'Please check your email to confirm your account ' +
                    'registration.'
            });
            return;
        } else {
            res.render('register', {
                successMessage: 'Oops, something went wrong. Please try again, if the problem ' +
                    'persist, contact your system administrator.'
            });
            return;
        }
    }
    catch (e) {
        next(e);
    }
});

app.get('/register.html', function (req, res) {
    res.render('register', {});
});

app.post('/api/upload', upload.single('upload'), async function (req, res, next) {
    let filePath = req.file.path;

});

app.post('/api/email', isLoggedIn, async (req, res, next) => {
    if (!req.body || !req.body.recipients || !req.body.message) {
        console.log("email failed. missing args");
        next(new Error("failed to send email, missing args in request body"));
    }

    try {
        let from = await db.getAppEmailAsync();
        let subject = "";
        if (req.body.subject)
            subject = req.body.subject;

        let emailResponse = await util.sendEmailAsync(from.emailFrom, from.email,
            from.emailPassword, req.body.recipients, req.body.message, subject);
        let status = emailResponse === "success" ? 200 : 500;
        res.sendStatus(status);
    }
    catch (e) {
        next(e);
    }
});

app.use(async function (err, req, res, next) {
    console.error(err.stack);
    let userId = "";
    let username = "";
    if (req && req.user && req.user.employeeId && req.user.email) {
        userId = req.user.employeeId;
        username = req.user.email;
    }

    try {
        await db.insertErrorAsync(err.stack, userId, username);
    }
    catch{ }

    res.status(500).send(err.stack);
});

app.listen(process.env.PORT || port, () => console.log(`Node server listening on port ${port}!`))