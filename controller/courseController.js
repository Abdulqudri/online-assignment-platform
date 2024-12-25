const Course = require("../model/Course")
const Department = require("../model/Department")


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
            res.status(201).json({message: "lecturer ID created successfully",name: newDepartment.name })
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
    }
    
}


module.exports = courseController