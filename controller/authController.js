const LecturerId = require("../model/LecturerId")
const User = require("../model/User")
const { hashPass, checkPass } = require("../util/password")

const roles = [ 'student', 'lecturer', 'admin'] 
const authController = {
    register: async (req, res) => {
        const { name, studentId, lecturerIdNo, email, password, role } = req.body;
    
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
    
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
    
        try {
            // Check if the email is already registered
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email is already registered' });
            }
    
            // Validate role
            const validRoles = ['student', 'lecturer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role selected.' });
            }
    
            // Handle student role
            if (role === 'student') {
                if (!studentId) {
                    return res.status(400).json({ error: 'Student ID is required for students.' });
                }
            }
            let lecturerExists;
    
            // Handle lecturer role
            if (role === 'lecturer') {
                if (!lecturerIdNo) {
                    return res.status(400).json({ error: 'Lecturer ID is required for lecturers.' });
                }
    
                // Check if lecturerIdNo exists in the database
                 lecturerExists = await LecturerId.findOne({ lecturerIdNo });
                if (!lecturerExists) {
                    return res.status(401).json({ error: 'Unauthorized: Lecturer ID does not exist.' });
                }
            }
    
            // Hash the password
            const hash = await hashPass(password);
            
            // Create and save the new user
            const newUser = new User({
                name,
                email,
                password: hash,
                studentId: role === 'student' ? studentId : undefined,
                lecturerId: role === 'lecturer' ? lecturerExists._id : undefined, // Use the _id from lecturerExists
                role,
            });
            await newUser.save();
    
            // Redirect to login page
            res.status(201).redirect('/auth/login');
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }
    
    
    ,
    login: async(req, res) => {
        const {email, password, role} = req.body
        if (!email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        try {
            const user = await User.findOne({email})
            if (!user) {
                return res.status(400).json('wrong credentials')
            }
            const match = await checkPass(password, user.password )
            if (!match) {
                return res.status(400).json('wrong credentials')
            }
            if (role != user.role) {
                return res.status(400).json('Invalid role  selected.');
            }

            req.session.user = { id: user._id, username: user.name, role: user.role };
            return res.status(200).redirect("/dashboard");
        } catch (error) {
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    },
    logout: (req, res) => {
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: 'Could not log out' });
          }
          res.clearCookie('connect.sid').json({message: "logout sucessful"});
          
        });
      }
}


module.exports = authController