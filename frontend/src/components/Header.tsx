//frontend/src/components/Header.tsx
import { Link } from "react-router-dom";
import logo from "@assets/logo.png"

const Header = () => (
    <header className="global-header">
        <Link to="/" className="header-logo-link">
            <h1 className="header-title">GitHelper</h1>
            <img src={logo} alt="GitHelper logo" className="header-logo" />
        </Link>
    </header>
);

export default Header;