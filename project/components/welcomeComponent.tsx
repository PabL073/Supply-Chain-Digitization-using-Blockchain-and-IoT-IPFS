import { useEffect } from "react";
import { useUser } from "../context/EntityData";

const WelcomeComponent = () => {
    const { user } = useUser();

    // Only render if there is a user and the user's name is not empty
    if (!user || user.name === "") {
        return null;
    }

    // Render the welcome message in a centered but not full-screen div
    return (
        <div className="flex items-center justify-center h-auto py-14"> {/* Height auto with some padding */}
            <h1 className="text-3xl font-bold mx-4">Welcome, {user.name}!</h1> {}
        </div>
    );
};

export default WelcomeComponent;
