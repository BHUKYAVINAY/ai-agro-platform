
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";

function Navbar() {
    const { signOut } = useClerk();
    const { user } = useUser();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate("/sign-in", { replace: true });
    };

    const links = [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/profile", label: "Farmer Profile" },
        { to: "/disease", label: "Disease Doctor" },
        { to: "/assistant", label: "AI Assistant" },
        { to: "/crop", label: "Crop Recommendation" },
        { to: "/weather", label: "Weather" },
        { to: "/planner", label: "Activity Planner" },
        { to: "/crop-growth", label: "Crop Growth" },
        { to: "/mandi-prices", label: "Mandi Prices" },
    ];

    return (
        <header className="navbar">
            <NavLink to="/dashboard" className="brand">
                <span className="brand-icon">🌱</span>
                <span>AGRO-AI</span>
            </NavLink>

            <nav className="nav-links">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="nav-user">
                <span>{user?.firstName || "Farmer"}</span>

                <button
                    className="button button-outline signout-button"
                    onClick={handleSignOut}
                >
                    Sign out
                </button>
            </div>
        </header>
    );
}

export default Navbar;
