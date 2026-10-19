

import "./styles/app.scss";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import { SignIn, SignUp } from "@clerk/clerk-react";

import CropAnalyticsPage from "./features/crop-growth/CropAnalyticsPage";
import CropObservationsPage from "./features/crop-growth/CropObservationsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./features/dashboard/Dashboard";
import FarmerProfile from "./features/farmer/FarmerProfile";
import DiseaseDetection from "./features/disease/DiseaseDetection";
import Assistant from "./features/assistant/Assistant";
import CropRecommendation from "./features/crop/CropRecommendation";
import Weather from "./features/weather/Weather";
import Alerts from "./features/alerts/Alerts";
import FarmPlanner from "./features/planner/FarmPlanner";
import CropGrowth from "./features/crop-growth/CropGrowth";
import MandiPrices from "./features/mandi/MandiPrices";



function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/sign-in/*"
                    element={
                        <div className="auth-page">
                            <SignIn routing="path" path="/sign-in" />
                        </div>
                    }
                />

                <Route
                    path="/sign-up/*"
                    element={
                        <div className="auth-page">
                            <SignUp routing="path" path="/sign-up" />
                        </div>
                    }
                />

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/"
                        element={<Dashboard />}
                    />
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />
                    <Route
                        path="/profile"
                        element={<FarmerProfile />}
                    />
                    <Route
                        path="/disease"
                        element={<DiseaseDetection />}
                    />
                    <Route
                        path="/assistant"
                        element={<Assistant />}
                    />
                    <Route 
                        path="/crop" 
                        element={<CropRecommendation />} 
                    />
                    <Route
                        path="/crop-growth/:cropId/analytics"
                        element={<CropAnalyticsPage />}
                    />

                    <Route
                        path="/crop-growth/:cropId/observations"
                        element={<CropObservationsPage />}
                    />
                    <Route
                        path="/crop-growth"
                        element={<CropGrowth />}
                    />
                    <Route 
                        path="/weather" 
                        element={<Weather />} 
                    />
                    <Route 
                        path="/alerts" 
                        element={<Alerts />} 
                    />
                    <Route 
                        path="/planner" 
                        element={<FarmPlanner />} 
                    />
                    <Route 
                        path="/mandi-prices" 
                        element={<MandiPrices />} 
                    />

                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
