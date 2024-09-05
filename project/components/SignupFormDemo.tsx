import React, { useEffect, useState } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { cn } from "../utils/cn";
import useRegisterEntity from "../hooks/useRegisterEntity";
import { useFileUrl } from "../context/FileUrlContext";

export function SignupFormDemo() {
    const [walletAddress, setWalletAddress] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState(0); 

    const { registerEntity } = useRegisterEntity(); 
    const { fileUrl,setFileUrl } = useFileUrl();

    const handleFileUpload = (link:string) => {
        setFileUrl(link);
    };
    useEffect(() => {
        //console.log("ZZZZZZZZZZZZZZZZZZ::::", fileUrl);
    }, [fileUrl]);




    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        if (!fileUrl) {
            alert("Please upload a file before submitting.");
            return;
        }

     
        const success = await registerEntity(walletAddress, role, companyName, location, 0 ,fileUrl);
        if (success) {
            alert("Registration successful!");
        } else {
            alert("Registration failed. Please check the console for errors.");
        }
    };

    return (
        
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
            
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                Become a Stakeholder
            </h2>
            <form className="my-8" onSubmit={handleSubmit}>
                <LabelInputContainer htmlFor="walletAddress" label="Wallet Address" value={walletAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletAddress(e.target.value)} placeholder="0x0000"/>
                <LabelInputContainer htmlFor="companyName" label="Company Name" value={companyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)} placeholder="DHL"/>
                <LabelInputContainer htmlFor="location" label="Location" value={location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} placeholder="Bucharest"/>
                
                <div className={cn("flex flex-col space-y-2 w-full")}>
                    <Label htmlFor="role">Role</Label>
                    <select id="role" value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(Number(e.target.value))} className="border border-gray-300 rounded p-2">
                        <option value={0}>Supplier</option>
                        <option value={1}>Producer</option>
                        <option value={2}>Transporter</option>
                        <option value={3}>Warehouse</option>
                        <option value={4}>Market</option>
                    </select>
                </div>
            

                <button
                    className="bg-gradient-to-br from-black to-neutral-600 text-white rounded-md h-12 font-medium shadow mx-auto block w-3/4 mt-4"
                    type="submit"
                >
                    Sign up &rarr;
                </button>
            </form>
        </div>
    );
}

const LabelInputContainer = ({
  htmlFor,
  label,
  value,
  onChange,
  placeholder
}: {
  htmlFor: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) => {
    return (
        <div className={cn("flex flex-col space-y-2 w-full")}>
            <Label htmlFor={htmlFor}>{label}</Label>
            <Input id={htmlFor} type="text" value={value} onChange={onChange} placeholder={placeholder} />
        </div>
    );
};
