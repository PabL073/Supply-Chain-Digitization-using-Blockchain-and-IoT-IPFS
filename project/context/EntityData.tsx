import { createContext, useContext, useState, ReactNode } from "react";
import { UserObject } from "../types/types";

export const initialValues: UserObject = {
    __length__: 7,
    EntityAddress: "",
    role: null, 
    name: "",
    location: "",
    isRegistered: false,
    isCertified: false,
    link : "",
};

export const UserContext = createContext<{
    user: UserObject;
    updateUser: (newUser: UserObject) => void;
}>({
    user: initialValues,
    updateUser: () => {} // No-op function for default context
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserObject>(initialValues);

    const updateUser = (newUser: UserObject) => {
        setUser(newUser);
    }

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
