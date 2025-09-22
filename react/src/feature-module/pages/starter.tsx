import React from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Footer from "../../core/common/footer";

const StarterPage = () => {
  const routes = all_routes;
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper vh-100 d-flex flex-column justify-content-between">
        <div className="content flex-fill h-100">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Starter </h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Pages</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Starter{" "}
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}
        </div>
        <Footer />
      </div>
      {/* /Page Wrapper */}
    </>
  );
};

export default StarterPage;
