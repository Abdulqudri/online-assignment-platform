const LecturerId = require("../model/LecturerId")

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
    }
}

module.exports = userController