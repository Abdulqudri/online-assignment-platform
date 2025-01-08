const Course = require("../model/Course")
const Department = require("../model/Department")
const User = require("../model/User")


const courseController = {
    createDept: async(req, res) => {
        const {departmentName} = req.body
        if(!departmentName){
            return res.status(400).json({messae: "all field are required"})
        }
        try {
            const existingDept = await Department.findOne({ departmentName})
            if(existingDept){
                return res.status(400).json({message: "department already exist"})
            }
            const newDepartment = new Department({ departmentName})
            await newDepartment.save()
            res.status(201).json({message: "Department created successfully",name: newDepartment.name })
        } catch (error) {
            res.status(500).json({message: error})
        }
    },
    getAllDept: async (req, res) => {
        try {
            const departments = await Department.find()
                .populate("courses") // Assuming 'courses' is referenced in the schema
                .exec();
    
            res.status(200).json({
                success: true,
                message: "Departments retrieved successfully",
                data: departments,
            });
        } catch (error) {
            console.error("Error retrieving departments:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve departments",
                error: error.message,
            });
        }
    },
    
    deleteDept: async (req, res) => {
        const { id } = req.params; // Correctly extracting the ID from route params
    
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Department ID is required",
            });
        }
    
        try {
            const deletedDepartment = await Department.findByIdAndDelete(id);
    
            if (!deletedDepartment) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }
    
            res.status(200).json({
                success: true,
                message: "Department deleted successfully",
                data: deletedDepartment,
            });
        } catch (error) {
            console.error("Error deleting department:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete department",
                error: error.message,
            });
        }
    },
    createCourse: async (req, res) => {
        const { name, code } = req.body;
        const  deptId  = req.params.id; // Assuming deptId is passed as a route parameter
        
        // Validate required fields
        if (!name || !code || !deptId) {
            return res.status(400).json({ message: "All fields are required" });
        }
    
        try {
            // Check if the department exists
            const department = await Department.findById(deptId);
            if (!department) {
                return res.status(404).json({ message: "Department not found" });
            }
    
            // Check if the course already exists
            const existingCourse = await Course.findOne({ name });
            if (existingCourse) {
                return res.status(400).json({ message: "Course already exists" });
            }
    
            // Create and save the new course
            const newCourse = new Course({ name, code });
            await newCourse.save();
    
            // Add the new course ID to the department's courses array
            department.courses.push(newCourse._id);
            await department.save();
    
            res.status(201).json({ message: "Course created successfully", course: newCourse });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error", details: error.message });
        }
    }, getCourses :async (req, res) => {
        const deptId = req.params.id;
    
        // Validate input
        if (!deptId) {
            return res.status(400).json({ success: false, message: "Department ID is required." });
        }
    
        try {
            // Find the department and populate its courses
            const department = await Department.findById(deptId)
                .populate("courses", "name code") // Specify fields to populate (optional optimization)
                .exec();
    
            // If department not found, return a 404 error
            if (!department) {
                return res.status(404).json({ success: false, message: "Department not found." });
            }
    
            // Return the populated courses
            return res.status(200).json({ success: true, data: department.courses });
        } catch (error) {
            // Handle server errors gracefully
            return res.status(500).json({
                success: false,
                message: "Server error.",
                details: error.message,
            });
        }
    }
    ,
    saveCourse: async (req, res) => {
        const { department, courses } = req.body;
    
        // Check if the user is logged in and exists in the session
        const userId = req.session?.user.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
    
        if (!department || !courses || !Array.isArray(courses)) {
            return res.status(400).json({
                message: "Department name and courses are required. Courses must be an array."
            });
        }
    
        try {
            // Fetch the logged-in user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
    
            if (user.role !== 'lecturer') {
                return res.status(403).json({ message: "Only lecturers can be assigned courses." });
            }
    
            // Find the department by name
            const departmentDoc = await Department.findById(department);
            if (!departmentDoc) {
                return res.status(404).json({ message: "Department not found." });
            }
    
            // Validate that the provided courses exist and belong to the department
            const validCourses = await Course.find({
                _id: { $in: departmentDoc.courses },
                _id: { $in: courses }
            });
    
            if (validCourses.length !== courses.length) {
                return res.status(400).json({ message: "Some courses are invalid or not part of the selected department." });
            }
    
            // Update the user's courses and department
            user.courses = validCourses.map(course => course._id);
            user.department = departmentDoc._id;
            await user.save();
    
            // Add the user's ID to the course schema for each course
            for (const course of validCourses) {
                course.lecturer = user._id; // Assuming the `Course` schema has a `lecturer` field
                await course.save();
            }
    
            res.status(200).json({
                success: true,
                message: "Courses assigned successfully.",
                data: {
                    userId: user._id,
                    department: department,
                    courses: validCourses.map(course => course.courseName)
                }
            });
        } catch (error) {
            console.error("Error saving courses to user:", error);
            res.status(500).json({ message: "Server error", details: error.message });
        }
    }
    ,
    saveStudentCourse : async (req, res) => {
        const { department, courses } = req.body;
    
        // Check if the user is logged in
        const userId = req.session?.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }
    
        // Validate input
        if (!department || !courses || !Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Department and courses are required. Courses must be a non-empty array.",
            });
        }
    
        try {
            // Fetch the logged-in user
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found." });
            }
    
            // Ensure the user is a student
            if (user.role !== "student") {
                return res.status(403).json({ success: false, message: "Only students can choose courses." });
            }
    
            // Fetch the department document
            const departmentDoc = await Department.findById(department).populate("courses", "name code");
            if (!departmentDoc) {
                return res.status(404).json({ success: false, message: "Department not found." });
            }
    
            // Validate that the provided courses belong to the selected department
            const validCourses = departmentDoc.courses.filter(course =>
                courses.includes(course._id.toString()) // Match selected courses with department's courses
            );
    
            if (validCourses.length !== courses.length) {
                return res.status(400).json({
                    success: false,
                    message: "Some courses are invalid or not part of the selected department.",
                });
            }
    
            // Merge new courses with the user's existing courses, avoiding duplicates
            const newCourseIds = validCourses.map(course => course._id.toString());
            const updatedCourses = [...new Set([...user.courses.map(c => c.toString()), ...newCourseIds])];
    
            // Update user document
            user.courses = updatedCourses;
            user.department = departmentDoc._id;
    
            await user.save();
    
            // Respond with success
            res.status(200).json({
                success: true,
                message: "Courses assigned successfully.",
                data: {
                    userId: user._id,
                    department: departmentDoc.departmentName,
                    courses: validCourses.map(course => ({ name: course.name, code: course.code })),
                },
            });
        } catch (error) {
            console.error("Error saving courses:", error);
            res.status(500).json({
                success: false,
                message: "Server error",
                details: error.message,
            });
        }
    }
    ,
    getLecturerCourse:  async (req, res) =>{
        
    if (!req.session.user || req.session.user.role !== 'lecturer') {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    try {
        const lecturerId = req.session.user.id; // Get the lecturer ID from session
        const student = await User.findById(lecturerId).populate('courses', 'name') // Find courses by lecturer ID
        if (!student) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            courses: student.courses
        });
    } catch (error) {
        console.error("Error fetching lecturer courses:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: error.message
        });
    }

    },
    getRegisterCourse:  async (req, res) => {
        try {
            const userId = req.session.user?.id; // Assuming user session is stored
    
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
            }
    
            // Find the student and populate their courses
            const student = await User.findById(userId).populate('courses', 'name'); // Populating 'name' field of courses
    
            if (!student) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
    
            return res.status(200).json({ success: true, courses: student.courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
        }
    }
    
}


module.exports = courseController