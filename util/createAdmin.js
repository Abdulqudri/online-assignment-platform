const User = require("../model/User");
const { hashPass } = require("./password");

const createAdmin = async() => {
    const email = process.env.ADMINEMAIL;
    if(!(await User.findOne({email}))){
        const hash = await hashPass(process.env.ADMINPASS)
        const admin = new User({
            name: 'admin', 
            role: 'admin',
            email,
            password: hash
        })

        await admin.save()
        console.log('created new admin')
        return
    }
    console.log('load previous admin')
}

module.exports = createAdmin;