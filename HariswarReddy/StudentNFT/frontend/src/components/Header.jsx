import React from "react";
import { Link } from "react-router-dom";
import { MdPerson } from "react-icons/md";
import "./header.css";

const Header = () => {
  return (
    <>
      <div className="nav-container bg-gradient-to-br from-black/100 to-black/70">
        <div className="left">
          <h3>LOGO.</h3>
        </div>
        <div className="mid">
                  <Link to={"/"}>Home</Link>
          <Link to={"/donate"}>Donate</Link>
          <Link to={"/register-student"}>Register</Link>
          <Link to={"/about"}>About</Link>
          <Link to={"/contact"}>Contact</Link>
        </div>
        <div className="right">
          <MdPerson size={20} />
        </div>
      </div>
    </>
  );
};

export default Header;
