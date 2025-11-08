//frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainPage from "@pages/MainPage";
import CallbackPage from "@pages/CallbackPage";
import HomePage from "@pages/OrgsPage";
import Header from "@components/Header";
import Footer from "@components/Footer";
import OrgReposPage from "@pages/OrgReposPage";
import ProjetPage from "@pages/ProjetPage";
import CreateGroupPage from "@pages/CreateGroupPage";

import "@styles/main.scss";

function App() {
    return (
        <>
            <Header />
            <div className="blobA"></div>
            <div className="blobB"></div>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/callback" element={<CallbackPage />} />
                    <Route path="/orgs" element={<HomePage />} />
                    <Route path="/orgs/:orgName" element={<OrgReposPage />} />
                    <Route path="/orgs/:orgName/project" element={<ProjetPage />} />
                    <Route path="/CreateGroup/:projectId/:key" element={<CreateGroupPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </main>
            <Footer />
        </>
    );
}

export default App;
