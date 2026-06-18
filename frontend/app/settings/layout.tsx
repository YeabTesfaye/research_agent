import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import { title } from "process";

export const metadata = {title : "Settings"}

export default function SettingsLayout({children} : {children : React.ReactNode}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-background">
                <NavBar />
                {children}
            </div>
        </AuthGuard>
    )
}