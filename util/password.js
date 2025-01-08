const bcrypt = require("bcrypt")

const saltRounds = 10;
const hashPass = async (pass) => {

    const salt = await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(pass, salt)
    if (hash ) {
        return hash
    }
    throw new Error("something went wrong")
}

const checkPass = async (pass, hash) => {
    const match = await bcrypt.compare(pass, hash)
    
    return match;
}
module.exports = {hashPass, checkPass};