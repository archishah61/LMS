import { useState } from "react"
import LeftSidebar from "./LeftSidebar"
import RightSidebar from "./RightSidebar"
import MainSection from "./MainSection"
import courseCategoryData from "../../data/CourseManagement/courseCategoryData"

export default function Docs() {
    const [selectedEndpoint, setSelectedEndpoint] = useState(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState(null)

    // Find the default category id from mock data
    const defaultCategoryId = courseCategoryData.responses && Array.isArray(courseCategoryData.responses[0]?.example)
        ? courseCategoryData.responses[0].example[0]?.id
        : null

    // Set default category on mount
    if (selectedCategoryId === null && defaultCategoryId !== null) {
        setSelectedCategoryId(defaultCategoryId)
    }

    const handleGetStarted = () => {
        // Set the selected endpoint to the default category endpoint
        setSelectedEndpoint('admin-login');
    };

    const handleCategoryChange = (catId) => {
        setSelectedCategoryId(catId)
    }

    return (
        <div className="flex flex-row w-full h-screen overflow-hidden bg-white">
            <LeftSidebar
                setSelectedEndpoint={setSelectedEndpoint}
                selectedEndpoint={selectedEndpoint}
                onCategoryChange={handleCategoryChange}
                selectedCategoryId={selectedCategoryId}
            />
            <MainSection 
                selectedEndpoint={selectedEndpoint}
                onGetStarted={handleGetStarted}/>
            <RightSidebar selectedEndpoint={selectedEndpoint} selectedCategoryId={selectedCategoryId} />
        </div>
    )
}
