const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const fs = require('fs');
const router = express.Router();
const regist = require('../regist');
const upload = multer({ dest: 'tmp/' });

router.use(function checklogin(req, res, next) {
    if (!req.session.loggedin) {
        return res.redirect('/')
    }
    next();
})

router.get('/', function(req, res, next) {
    res.redirect('/private/single')
})

router.get('/single', function(req, res, next) {
    let flashMsgSuccess = req.flash("success");
    let flashMsgError = req.flash("error");
    res.render('private/single', {flashMsgError: flashMsgError, flashMsgSuccess: flashMsgSuccess})
})

router.post('/createsingle', async function(req, res, next) {
    let accname = req.body.accname;
    let accmail = req.body.accmail;
    let accpass = req.body.accpass;

    if (accname.length < 3) {
        req.flash("error", "Username cannot be less than three letters.");
        return res.redirect('/private/single');
    }

    if (accpass.length < 5) {
        req.flash("error", "Password cannot be less than five letters.");
        return res.redirect('/private/single');
    }

    let result = await regist.makeUserAcc(accname, accmail, accpass);
    //if (regist.makeUserAcc(accname, accmail, accpass)) {

    if (result[0]) {
        req.flash("success", result[1]);
        res.redirect('/private/single');
    } else {
        req.flash("error", result[1]);
        res.redirect('/private/single');
    }
})

router.get('/multiple', async function(req, res, next) {
    let flashMsgs = req.flash("info");
    let flashMsgsProcessed = [];
    for (let fm of flashMsgs) {
        flashMsgsProcessed.push(JSON.parse(fm));
    }
    
    csvdata = req.session.csvdata;
    //csvdata = req.flash("csvdata")
    if ((csvdata) && (csvdata.length > 0)) {
         csvdata = Buffer.from(csvdata).toString('base64')
         delete req.session.csvdata
    }

    res.render('private/multiple', {
        flashMsgs: flashMsgsProcessed,
        csvstring: csvdata
    })
})

router.post('/createmultiple', upload.single('csvfile'), async function(req, res, next) {
    const fileRows = [];
    csv.parseFile(req.file.path)
        .on("data", async function(data) {
            // validation
            if (data.length !== 3) {
                req.flash("info", JSON.stringify({ type: "error", msg: data.join(", ") + " may have missing fields." }));
                fileRows.push([...data,"failed"])
            } else {
                let accname = data[0];
                let accmail = data[1];
                let accpass = data[2];

                if (accname.length < 3) {
                    req.flash("info", JSON.stringify({ type: "error", msg: data.join(", ") + " Username cannot be less than three letters." }));
                    fileRows.push([...data,"failed"])
                } else if (!accmail.includes("@")) {
                    req.flash("info", JSON.stringify({ type: "error", msg: data.join(", ") + " Password cannot be less than five letters."}));
                    fileRows.push([...data,"failed"])
                } else if (accpass.length < 5) {
                    req.flash("info", JSON.stringify({ type: "error", msg: data.join(", ") + " Email does not look like an email."}));
                    fileRows.push([...data,"failed"])
                } else {
                    let result = await regist.makeUserAcc(accname, accmail, accpass);
                    if (result[0]) {
                        req.flash("info", JSON.stringify({ type: "success", msg: data.join(", ") + result[1] }));
                        fileRows.push([...data, "success"])
                    } else {
                        req.flash("info", JSON.stringify({ type: "error", msg: data.join(", ") + result[1] }));
                        fileRows.push([...data,"failed"])
                    }
                }
            }
        })
        .on("end", async function() {
            fs.unlinkSync(req.file.path);

            const csvdata = await csv.writeToString(fileRows, {
                rowDelimiter: '\r\n',
                includeEndRowDelimiter: true });

            req.session.csvdata = csvdata;
            //req.flash("csvdata", csvdata);
            return res.redirect("/private/multiple")
        })
    //res.send('ok');
});

router.get('/logout', function(req, res, next) {
    req.session.loggedin = false;
    res.redirect('/');
})

module.exports = router;
