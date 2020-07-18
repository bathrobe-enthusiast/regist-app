const fetch = require('node-fetch');

let now = new Date();
now = [now.getFullYear(), now.getMonth() + 1, now.getDate(), "120000"].map(d => d.toString()).map(a => (a.length < 2) ? "0"+a : a).join("");

function makeUserAccData(username, password, email) {
    const data = {
        HEADER: { COMPANY: "voxdei",
                SECRET: "ASFOQWM+DFMLVMASLKRJQO!!",
                OP_TIME: now,
                OP_SN: "11" + now + "0000",
                TOKEN: "",
                CHANNEL_ID: "11" },
        BODY: { USER_ID: 0,
                USER_NAME: username,
                PASSWORD: password,
                EMAIL: email
            }
    }
    return data;
}

async function makeUserAcc(username, email, password) {
    let data = makeUserAccData(username, password, email);

    const result = await fetch("https://voxdei.co:8099/regist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
    .then(res => res.json())
    .then(data => {
        if (data.HEADER.RETURN_CODE === 0) {
            return [true, "New user account successfully created."];
            // success
        } else {
            let failmsg = data.HEADER.RETURN_MSG;
            if (failmsg.length > 1) {
                failmsg = failmsg.charAt(0).toUpperCase() + failmsg.slice(1);
                if (failmsg.charAt(failmsg.length - 1) !== '.') {
                    failmsg = failmsg + '.';
                }
            }
            return [false, failmsg];
        }
    })
    .catch((error) => {
        console.log(error);
        return [false, "Account creation unsuccessful, ask XJ."]
    })

    return result;
}

module.exports = {
    makeUserAcc: makeUserAcc
}
