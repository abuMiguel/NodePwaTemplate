This is a simple starting point for a complete, light-weight, progressive web app using NodeJS and the Pug template engine.

I designed this to be a fully self-contained app (db, services, and ui all in one, one repo, one deployment).

It doesn't include a front-end JavaScript framework. You can add your own if you need it, or go full vanilla. I added a minimal 
amount of dependencies and I think you will find this to be a very lean stack.

Using this template, you can just start creating your app and hopefully it is useful enough to save some people a lot of time.
I'm open to comments, suggestions, and feedback.


This template is packed with features and includes boiler plate code for the following:
PWA manifest
service worker registration using Workbox
html email sending service using email templates
uploading files
database access layer using async functions with sqlite3
a sqlite database with a user table, configuration table, and error log table
NodeJS server using Express
authentication using Passport with local strategy
sessions using express-session
route protection
password encryption/decryption
flash messages
error handling and logging
user registration over email
material lite login form
