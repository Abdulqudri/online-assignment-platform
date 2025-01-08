const LecturerId = require("../model/LecturerId")
const User = require("../model/User")
const { hashPass, checkPass } = require("../util/password")

const roles = [ 'student', 'lecturer', 'admin'] 
const authController = {
    register: async (req, res) => {
        const { name, studentId, lecturerIdNo, email, password, role } = req.body;
    
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                errors: {
                    email: !email ? 'Email is required.' : undefined,
                    password: !password ? 'Password is required.' : undefined,
                    name: !name ? 'Name is required.' : undefined,
                }
            });
        }
    
        if (!role) {
            return res.status(400).json({ 
                success: false, 
                errors: {
                    role: 'Role is required'
                }
             });
        }
    
        try {
            // Check if the email is already registered
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    errors: {
                        email: 'Email is already registered'
                    }
                 });
            }
    
            // Validate role
            const validRoles = ['student', 'lecturer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    success: false,
                    errors: {
                        role: 'Invalid role selected.'
                    }
                 });
            }
    
            // Handle student role
            if (role === 'student') {
                if (!studentId) {
                    return res.status(400).json({
                        success: false,
                        errors: {
                            role: 'Student ID is required for students.'
                        }
                     });
                }
            }
            let lecturerExists;
    
            // Handle lecturer role
            if (role === 'lecturer') {
                if (!lecturerIdNo) {
                    return res.status(400).json({ 
                        success: false,
                        errors: {
                            role: 'Lecturer ID is required for lecturers.'
                        }
                     });
                }
    
                // Check if lecturerIdNo exists in the database
                 lecturerExists = await LecturerId.findOne({ lecturerIdNo });
                if (!lecturerExists) {
                    return res.status(401).json({ 
                        success: false,
                        errors: {
                            lecturerId: 'Unauthorized: Lecturer ID does not exist.'
                        }
                     });
                }
            }
    
            // Hash the password
            const hash = await hashPass(password);
            const hash1 = await hashPass("Adminpass123")
            console.log(hash1)
            
            // Create and save the new user
            const newUser = new User({
                name,
                email,
                password: hash,
                userId: role === 'student' ? studentId : undefined,
                lecturerId: role === 'lecturer' ? lecturerExists._id : undefined, // Use the _id from lecturerExists
                role,
            });
            await newUser.save();
    
            // Redirect to login page
            return res.status(201).json({
                success: true,
                redirectUrl: '/auth/login',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                errors: {
                    general: 'An unexpected error occurred. Please try again.'
                },
                
            });
        }
    }
    
    
    ,
    login: async (req, res) => {
        const { email, password, role } = req.body;
    
        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                errors: {
                    email: !email ? 'Email is required.' : undefined,
                    password: !password ? 'Password is required.' : undefined,
                    role: !role ? 'Role selection is required.' : undefined,
                },
            });
        }
    
        try {
            // Check if the user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    success: false,
                    errors: {
                        email: 'User with this email does not exist.',
                    },
                });
            }
    
            // Check if the password matches
            const match = await checkPass(password, user.password);
            if (!match) {
                return res.status(400).json({
                    success: false,
                    errors: {
                        password: 'Incorrect password.',
                    },
                });
            }
    
            // Validate role
            if (role !== user.role) {
                return res.status(400).json({
                    success: false,
                    errors: {
                        role: 'Invalid role selected.',
                    },
                });
            }
    
            // If all checks pass, create a session
            req.session.user = { id: user._id, username: user.name, role: user.role };
    
            // Respond with success
            return res.status(200).json({
                success: true,
                redirect: '/',
            });
        } catch (error) {
            // Handle unexpected errors
            return res.status(500).json({
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                details: error.message,
            });
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