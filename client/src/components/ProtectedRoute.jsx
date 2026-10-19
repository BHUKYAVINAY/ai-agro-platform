
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import Navbar from "./Navbar";
import Loading from "./Loading";

function ProtectedRoute() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();

    if (!isLoaded) {
        return <Loading message="Checking your session..." />;
    }

    if (!isSignedIn) {
        return (
            <Navigate
                to="/sign-in"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return (
        <div className="app-layout">
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default ProtectedRoute;
