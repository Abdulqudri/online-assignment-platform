const Assignment = require("../model/Assignment")
const LecturerId = require("../model/LecturerId")
const User = require("../model/User")

const userController = {
    lecturerId: async(req, res) => {
        const {lecturerId}= req.body
        if(!lecturerId){
            return res.status(400).json({messae: "all field are required"})
        }
        try {
            const existingId = await LecturerId.findOne({lecturerId})
            if(existingId){
                return res.status(400).json({message: "id already exist"})
            }
            const newId = new LecturerId({ lecturerIdNo: lecturerId})
            await newId.save()
            res.status(201).json({message: "lecturer ID created successfully",Id: newId.lecturerIdNo})
        } catch (error) {
            res.status(500).json({messae: error})
        }
    },
    deleteUser: async (req, res) => {
        const { id } = req.params; // Extract user ID from route parameters
        
        if (!id) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }
        
        try {
            const deletedUser = await User.findByIdAndDelete(id); // Find and delete user by ID
            
            if (!deletedUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            
            res.status(200).json({
                success: true,
                message: "User deleted successfully",
                data: deletedUser
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
        }
    },
    
    getAllUser: async (req, res) => {
        try {
            const users = await User.find({ role: { $ne: 'admin' } });
            if (!users.length) {
                return res.status(404).json({ success: false, message: "No users found" });
            }
            
            res.status(200).json({
                success: true,
                message: "Users retrieved successfully",
                data: users
            });
        } catch (error) {
            console.error("Error retrieving users:", error);
            res.status(500).json({ success: false, message: "Failed to retrieve users", error: error.message });
        }
    },
    analysis: async (req, res) => {
        try {
            // Fetching data
            const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } }); // Excluding admin users
            const totalAssignments = await Assignment.countDocuments(); // Total assignments
            const totalSubmissions = await Assignment.countDocuments({ status: 'submitted' }); // Total submissions
            const activeUsers = await User.countDocuments({ lastActive: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } }); // Active users in the last 30 days
    
            // Send the data as JSON response
            res.status(200).json({
                totalUsers,
                totalAssignments,
                totalSubmissions,
                activeUsers
            });
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            res.status(500).json({
                message: 'Failed to fetch analytics data',
                error: error.message
            });
        }
    }
    
}

module.exports = userController