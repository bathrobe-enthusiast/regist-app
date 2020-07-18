const express = require('express');
const router = express.Router();
const usrpwd = require('../usrpwd');

/* GET home page. */
router.get('/', function(req, res, next) {
    let flashMsg = req.flash("error")
    res.render('index', {flashMsg: flashMsg});
});

router.post('/login', function(req, res, next) {
    if ((req.body.username === usrpwd.username) && (req.body.password == usrpwd.password)) {
        req.session.loggedin = true;
        return res.redirect('/private');
    } else {
        req.session.loggedin = false;
        req.flash("error", "Incorrect username or password");
        return res.redirect('/');
    }
})

module.exports = router;
