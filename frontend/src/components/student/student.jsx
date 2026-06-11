/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import { mockEnrollments } from './mockData';
import { EnrollmentTable } from './EnrollmentTable';

export default function Student() {
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate(); // Initialize useNavigate
  useEffect(() => {
    if (!id) {
      navigate("/admin/dashboard");
      return;
    }
  }, [id, navigate]);
  return (
    <>
      <EnrollmentTable />
    </>

  );
}
