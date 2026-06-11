/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetCourseByIdQuery,
  useUpdateCourseMutation,
  courseApi
} from "../../../services/Course_Management/courseApi";
import toast from "react-hot-toast";
import { Upload, Loader2, ArrowLeft, X, Plus, Download } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { useGetActiveCourseCategoriesQuery } from "../../../services/Course_Management/courseCatagoryApi";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { getAdminToken } from "../../../services/CookieService";
import AdminLoader from "../AdminLoader";

export default function EditCourse() {
  const courseId = useLocation().state?.public_hash;
  const { access_token } = getAdminToken();
  const navigate = useNavigate();
  const {
    data: course,
    error,
    isLoading,
  } = useGetCourseByIdQuery({ id: courseId, access_token });

  const [triggerExport, { isFetching: isExporting }] = courseApi.endpoints.exportCourse.useLazyQuery();

  const handleExport = async () => {
    try {
      const response = await triggerExport({ id: courseId, access_token }).unwrap();
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `course_${courseId}_export.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Course JSON exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export course data.");
    }
  };

  const [updateCourse, { isLoading: isLoadingUpdateCourse }] =
    useUpdateCourseMutation();
  const { data: categories, isLoading: isLoadingCategories } =
    useGetActiveCourseCategoriesQuery({ access_token });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [seoImagePreview, setSeoImagePreview] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [detailPreviews, setDetailPreviews] = useState([]);
  const [previewModal, setPreviewModal] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    discount: 0,
    duration_minutes: "",
    expiry_days: "",
    min_access_minutes: "",
    max_access_minutes: "",
    courseThumbnail: null,
    coursePreviewVideo: null,
    status: "",
    what_you_will_learn: [""],
    prerequisites: [""],
    skill_development: [{ title: "", statements: [""] }],
    hashtags: [""],
    is_points_enrollable: false,
    points_to_enroll: 0,
    is_points_rewarded: false,
    points_rewarded: 0,
    is_points_rewarded_on_completion: false,
    points_rewarded_on_completion: 0,
    is_copy_paste_allowed: false,
    is_course_trending: false,
    meta_title: "",
    meta_keyword: "",
    meta_description: "",
    seo_image: "",
    seo_image_alt: "",
    seo_canonical: "",
    og_title: "",
    og_description: "",
    og_image: "",
    og_image_alt: "",
  });

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    console.log("course", course)
    if (course) {
      let previewsArray = [];
      if (course?.preview_video) {
        try {
          previewsArray = Array.isArray(course.preview_video)
            ? course.preview_video
            : (typeof course.preview_video === 'string' && course.preview_video.startsWith('[')
              ? JSON.parse(course.preview_video)
              : [course.preview_video]);
        } catch (e) {
          previewsArray = [course.preview_video];
        }
      }
      setDetailPreviews(
        previewsArray.map(path => ({
          url: `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`,
          isImage: String(path).includes('/course/preview_image/'),
          path: path,
          name: String(path).split('/').pop()
        }))
      );

      setFormData({
        title: course.title,
        description: course.description,
        category_id: course.category_id,
        price: course.price,
        discount: course.discount || 0,
        duration_minutes: course.duration_minutes,
        expiry_days: course.expiry_days,
        min_access_minutes: course.min_access_minutes || "",
        max_access_minutes: course.max_access_minutes || "",
        courseThumbnail: null,
        coursePreviewVideo: previewsArray,
        status: course.status || "draft",
        what_you_will_learn: course.what_you_will_learn?.length
          ? course.what_you_will_learn
          : [""],
        prerequisites: course.prerequisites?.length
          ? course.prerequisites
          : [""],
        skill_development: course.skill_development?.length
          ? (typeof course.skill_development === "string" ? JSON.parse(course.skill_development) : course.skill_development)
          : [{ title: "", statements: [""] }],
        hashtags: course.hashtags?.length ? course.hashtags : [""],
        is_points_enrollable: course.is_points_enrollable,
        points_to_enroll: course.points_to_enroll,
        is_points_rewarded: course.is_points_rewarded,
        points_rewarded: course.points_rewarded,
        is_points_rewarded_on_completion: course.is_points_rewarded_on_completion,
        points_rewarded_on_completion: course.points_rewarded_on_completion,
        is_copy_paste_allowed: course.is_copy_paste_allowed,
        is_course_trending: course.is_course_trending,
        meta_title: course.meta_title,
        meta_keyword: course.meta_keyword,
        meta_description: course.meta_description,
        seo_image: course.seo_image,
        seo_image_alt: course.seo_image_alt,
        seo_canonical: course.seo_canonical,
        og_title: course.og_title,
        og_description: course.og_description,
        og_image: course.og_image,
        og_image_alt: course.og_image_alt,
      });
    }
  }, [course]);

  const handleRemovePreview = (index) => {
    setDetailPreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setFormData(prev => {
      const newFiles = Array.isArray(prev.coursePreviewVideo) ? [...prev.coursePreviewVideo] : [];
      newFiles.splice(index, 1);
      return { ...prev, coursePreviewVideo: newFiles };
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target || {};

    if (name === "courseThumbnail" && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else if (name === "coursePreviewVideo" && files && files.length > 0) {
      const selectedFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        [name]: prev[name] ? [...prev[name], ...selectedFiles] : [...selectedFiles]
      }));
      const previews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        isImage: file.type && file.type.startsWith("image/"),
        name: file.name
      }));
      setDetailPreviews(prev => [...prev, ...previews]);
      return;
    } else if (name === "courseSEOImage" && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setSeoImagePreview(previewUrl);
    } else if (name === "courseOGImage" && files && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setOgImagePreview(previewUrl);
    } else if (name === "min_access_minutes" || name === "max_access_minutes") {
      const regex = /^\d*\.?\d{0,2}$/;
      if (regex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "category_id" || name === "discount"
            ? parseInt(value, 10) || 0
            : files
              ? (name === "coursePreviewVideo" ? Array.from(files) : files[0])
              : value,
      }));
    }
  };

  const isValidUrl = (value) => {
    if (!value) return true; // allow empty
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleCanonicalChange = (e) => {
    const value = e.target.value;

    const valid = isValidUrl(value);

    // optional: store error state
    setErrors(prev => ({
      ...prev,
      seo_canonical: !valid
    }));

    // always allow typing
    handleChange(e);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value === "") return;
    const floatValue = parseFloat(value);
    const formattedValue = floatValue.toFixed(2);
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const formatToHoursAndMinutes = (decimalMinutes) => {
    if (!decimalMinutes) return "";
    const hours = Math.floor(decimalMinutes / 60);
    const minutes = Math.round(decimalMinutes % 60);
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };

  const handleDynamicChange = (e, index, field) => {
    const newValues = [...formData[field]];
    newValues[index] = e.target.value;
    setFormData({ ...formData, [field]: newValues });
  };

  const addField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ""] });
  };

  const removeField = (field, index) => {
    const newValues = [...formData[field]];
    if (newValues.length > 1) {
      newValues.splice(index, 1);
      setFormData({ ...formData, [field]: newValues });
    }
  };

  const handleAddSkill = () => {
    setFormData({ ...formData, skill_development: [...formData.skill_development, { title: "", statements: [""] }] })
  }

  const handleRemoveSkill = (index) => {
    const list = [...formData.skill_development]
    if (list.length > 1) {
      list.splice(index, 1)
      setFormData({ ...formData, skill_development: list })
    }
  }

  const handleSkillTitleChange = (index, value) => {
    const list = [...formData.skill_development];

    list[index] = {
      ...list[index],
      title: value
    };

    setFormData({
      ...formData,
      skill_development: list
    });
  };

  const handleSkillStatementChange = (skillIndex, statementIndex, value) => {
    const list = [...formData.skill_development];

    list[skillIndex] = {
      ...list[skillIndex],
      statements: list[skillIndex].statements.map((statement, index) =>
        index === statementIndex ? value : statement
      )
    };

    setFormData({
      ...formData,
      skill_development: list
    });
  };

  const handleAddSkillStatement = (skillIndex) => {
    const list = [...formData.skill_development]
    list[skillIndex].statements.push("")
    setFormData({ ...formData, skill_development: list })
  }

  const handleRemoveSkillStatement = (skillIndex, statementIndex) => {
    const list = [...formData.skill_development];

    if (list[skillIndex].statements.length > 1) {
      const statements = list[skillIndex].statements.filter((_, index) => index !== statementIndex);
      list[skillIndex] = { ...list[skillIndex], statements };
      setFormData({ ...formData, skill_development: list });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      let value = formData[key];

      if (key === "coursePreviewVideo" && Array.isArray(value) && value.some(item => item instanceof File)) {
        value.forEach(file => formDataToSend.append("coursePreviewVideo", file));
        return;
      }

      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      } else if (value === null || value === undefined) {
        return;
      }

      formDataToSend.append(key, value);
    });

    try {
      const response = await updateCourse({
        id: courseId,
        formData: formDataToSend,
        access_token: access_token,
      }).unwrap();
      if (response?.error) {
        toast.error(response?.error?.data?.message);
      } else {
        toast.success("Course updated successfully!");
      }
      setTimeout(() => {
        navigate("/admin/dashboard/course");
      }, 500);
    } catch (error) {
      console.error("Error Updating Course:", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to update course';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return <AdminLoader className="h-screen" message="Loading Course Details..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-error">Failed to load course details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} mx-auto max-w-full`}>
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex flex-col items-center w-full">
              {/* Top Row: Title centered + Back button on right */}
              <div className="flex items-center justify-between w-full">
                {/* Empty space on left to perfectly balance the back button */}
                <div className="w-10 flex-shrink-0"></div>

                {/* Centered Title */}
                <h1 className="text-xl font-bold text-forestGreen">
                  Edit Course
                </h1>

                {/* Back button on right */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex border items-center justify-center text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* Update button fully centered below the title */}
              <PermissionWrapper section="Course" action="edit">
                <button
                  type="submit"
                  form="course-form"
                  className="mt-1 bg-leafGreen   text-white px-20 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-sm whitespace-nowrap disabled:opacity-50"
                  disabled={isLoadingUpdateCourse}
                >
                  {isLoadingUpdateCourse ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </button>
              </PermissionWrapper>
            </div>
          )}
          {/* Desktop Header */}
          {!isMobile && (
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-forestGreen">
                Edit Course
              </h1>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-4 h-4 inline-block mr-1" /> Export JSON</>}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-lightGreen/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>
                <PermissionWrapper section="Course" action="edit">
                  <button
                    type="submit"
                    form="course-form"
                    className="px-4 py-2 text-sm font-medium text-white bg-leafGreen rounded-lg shadow-sm   transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                    disabled={isLoadingUpdateCourse}
                  >
                    {isLoadingUpdateCourse ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Update Course"
                    )}
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className={`${isMobile ? 'p-4' : 'p-6'} flex-1 overflow-y-auto mx-auto w-full max-w-full`}>
        <form
          id="course-form"
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg overflow-hidden border transition-all duration-300 w-full"
          encType="multipart/form-data"
        >
          <div className={`${isMobile ? 'p-4 space-y-6' : 'p-6 space-y-6'} w-full`}>

            {/* Basic Info Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                Basic Information
              </h2>
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 w-full">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option disabled value="">
                      Select Category
                    </option>
                    {isLoadingCategories ? (
                      <option>Loading...</option>
                    ) : (
                      categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* Media Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                Media
              </h2>
              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 w-full">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Thumbnail
                  </label>
                  <div className="w-full flex justify-center px-4 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-all duration-200 hover:border-leafGreen/50">
                    <div className="space-y-1 text-center w-full">
                      {thumbnailPreview ? (
                        <div className="relative w-full">
                          <img
                            src={thumbnailPreview}
                            alt="Course thumbnail"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                        </div>
                      ) : course?.thumbnail ? (
                        <div className="relative w-full">
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail || '/placeholder.png'}`}
                            alt="Course thumbnail"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-leafGreen hover:text-forestGreen">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            name="courseThumbnail"
                            className="sr-only"
                            accept="image/*"
                            // required
                            onChange={handleChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Detail Image/Video
                  </label>
                  <button
                    type="button"
                    onClick={() => document.getElementById("coursePreviewVideo").click()}
                    className="cursor-pointer border border-leafGreen text-leafGreen px-4 py-2 rounded-lg hover:bg-lightGreen/20 transition-colors flex items-center gap-2 text-sm mb-2"
                  >
                    <Plus className="w-4 h-4" /> Add Media
                    <input
                      id="coursePreviewVideo"
                      name="coursePreviewVideo"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="sr-only"
                      onChange={handleChange}
                    />
                  </button>
                  <div className="w-full flex justify-center px-4 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-all duration-200 hover:border-leafGreen/50">
                    <div className="space-y-1 text-center w-full">
                      {detailPreviews && detailPreviews.length > 0 ? (
                        <div className="flex flex-col gap-2 w-full">
                          {detailPreviews.map((preview, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors">
                              <div
                                className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
                                onClick={() => setPreviewModal(preview)}
                              >
                                {preview.isImage ? (
                                  <img
                                    src={preview.url}
                                    alt="preview"
                                    className="w-10 h-10 rounded object-cover shadow-sm bg-white flex-shrink-0"
                                  />
                                ) : (
                                  <video
                                    src={preview.url}
                                    className="w-10 h-10 rounded object-cover shadow-sm bg-black flex-shrink-0"
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-700 truncate" title={preview.name || `Media ${idx + 1}`}>
                                  {preview.name || `Media ${idx + 1}`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePreview(idx)}
                                className="text-red-500 hover:text-red-700 p-1.5 focus:outline-none flex-shrink-0"
                                title="Remove preview"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Tip: Use a 16:9 image for best results
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Course Details Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                Course Details
              </h2>
              <div className="space-y-4 w-full">
                <div className="w-full">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="w-full overflow-hidden">
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API}
                      value={formData.description}
                      init={{
                        height: isMobile ? 200 : 250,
                        menubar: true,
                        plugins: [
                          "advlist", "autolink", "lists", "link", "charmap", "print", "preview", "anchor",
                          "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media",
                          "table", "paste", "help", "wordcount", "emoticons", "hr", "nonbreaking",
                        ],
                        toolbar: "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                        content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                        width: '100%',
                        resize: false
                      }}
                      onEditorChange={handleEditorChange}
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 w-full">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        min="0"
                        value={formData.price || 0}
                        required
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      placeholder="Enter discount percentage"
                      value={formData.discount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 w-full">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      min="0"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry (days) *
                    </label>
                    <input
                      type="number"
                      name="expiry_days"
                      min="1"
                      value={formData.expiry_days}
                      required
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 w-full">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Access Minutes
                    </label>
                    <input
                      type="text"
                      name="min_access_minutes"
                      value={formData.min_access_minutes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                    {formData.min_access_minutes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatToHoursAndMinutes(parseFloat(formData.min_access_minutes))}
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Access Minutes
                    </label>
                    <input
                      type="text"
                      name="max_access_minutes"
                      value={formData.max_access_minutes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                    {formData.max_access_minutes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatToHoursAndMinutes(parseFloat(formData.max_access_minutes))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dynamic Fields */}
                {['what_you_will_learn', 'prerequisites', 'hashtags'].map((field) => (
                  <div key={field} className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {field.replace(/_/g, ' ')}
                    </label>
                    {formData[field].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2 w-full">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleDynamicChange(e, index, field)}
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                          placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeField(field, index)}
                          className="text-red-500 hover:text-red-700 p-2 flex-shrink-0 text-sm sm:text-base"
                          disabled={formData[field].length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addField(field)}
                      className="text-leafGreen px-3 py-1 border border-leafGreen rounded-lg hover:bg-lightGreen/20 transition text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add More
                    </button>
                  </div>
                ))}

                {/* Skill Development Section in EditCourse */}
                <div className="group border border-gray-200 p-4 rounded-lg w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Development</label>
                  {formData.skill_development?.map((skill, skillIndex) => (
                    <div key={skillIndex} className="mb-4 p-4 border border-leafGreen/20 bg-lightGreen/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={skill.title}
                          onChange={(e) => handleSkillTitleChange(skillIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-leafGreen text-sm sm:text-base"
                          placeholder="Skill Title (e.g., Frontend Development)"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skillIndex)}
                          className="text-red-500 px-3 py-2 border border-red-500 bg-white rounded-lg hover:bg-red-50 transition text-sm flex-shrink-0"
                          disabled={formData.skill_development.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="pl-4 border-l-2 border-leafGreen/30 ml-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Statements</label>
                        {skill.statements.map((statement, statementIndex) => (
                          <div key={statementIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={statement}
                              onChange={(e) => handleSkillStatementChange(skillIndex, statementIndex, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen"
                              placeholder="Relevant statement for this skill"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillStatement(skillIndex, statementIndex)}
                              className="text-red-500 px-2 py-1.5 border border-red-300 bg-white rounded-md hover:bg-red-50 transition flex-shrink-0"
                              disabled={skill.statements.length === 1}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddSkillStatement(skillIndex)}
                          className="text-leafGreen px-2 py-1 border border-leafGreen rounded-md hover:bg-lightGreen/20 transition flex items-center gap-2 text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" /> Add Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="w-full mt-2 text-leafGreen px-4 py-3 border-2 border-leafGreen/20 border-dashed rounded-lg hover:bg-lightGreen/10 font-medium transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Skill
                  </button>
                </div>

                {/* Points Section */}
                <div className="space-y-4 border-t pt-4 w-full">
                  <div className="flex items-center space-x-2">
                    <input
                      id="is_points_enrollable"
                      name="is_points_enrollable"
                      type="checkbox"
                      checked={formData.is_points_enrollable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_enrollable: e.target.checked,
                          points_to_enroll: e.target.checked ? formData.points_to_enroll : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_enrollable" className="text-sm font-medium text-gray-700">
                      Allow Enrollment via Points
                    </label>
                  </div>

                  {(formData.is_points_enrollable === 1 || formData.is_points_enrollable === true) && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points Required to Enroll
                      </label>
                      <input
                        type="number"
                        min={10}
                        placeholder="Enter points required"
                        value={formData.points_to_enroll}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_to_enroll: parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id="is_points_rewarded"
                      name="is_points_rewarded"
                      type="checkbox"
                      checked={formData.is_points_rewarded}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_rewarded: e.target.checked,
                          points_rewarded: e.target.checked ? formData.points_rewarded : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_rewarded" className="text-sm font-medium text-gray-700">
                      Enable Points Reward on Purchase
                    </label>
                  </div>

                  {(formData.is_points_rewarded === 1 || formData.is_points_rewarded === true) && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points to be Rewarded on Course Purchase
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Enter points to be rewarded"
                        value={formData.points_rewarded}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_rewarded: parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id="is_points_rewarded_on_completion"
                      name="is_points_rewarded_on_completion"
                      type="checkbox"
                      checked={formData.is_points_rewarded_on_completion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_rewarded_on_completion: e.target.checked,
                          points_rewarded_on_completion: e.target.checked ? formData.points_rewarded_on_completion : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_rewarded_on_completion" className="text-sm font-medium text-gray-700">
                      Enable Points Reward on Completion
                    </label>
                  </div>

                  {(formData.is_points_rewarded_on_completion === 1 || formData.is_points_rewarded_on_completion === true) && (
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points to be Rewarded on Course Completion
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Enter points to be rewarded on Course Completion"
                        value={formData.points_rewarded_on_completion}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_rewarded_on_completion: parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id="is_copy_paste_allowed"
                      name="is_copy_paste_allowed"
                      type="checkbox"
                      checked={formData.is_copy_paste_allowed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_copy_paste_allowed: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_copy_paste_allowed" className="text-sm font-medium text-gray-700">
                      Allow Copy Paste Course Content
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="is_course_trending"
                      name="is_course_trending"
                      type="checkbox"
                      checked={formData.is_course_trending}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_course_trending: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_course_trending" className="text-sm font-medium text-gray-700">
                      Set Course As Trending
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Meta Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                Meta
              </h2>

              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-stretch">

                {/* LEFT SIDE — STACKED */}
                <div className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                    <input
                      id="meta_title"
                      name="meta_title"
                      type="text"
                      value={formData.meta_title}
                      onChange={handleChange}
                      // required
                      placeholder="Enter meta title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keyword</label>
                    <input
                      id="meta_keyword"
                      name="meta_keyword"
                      type="text"
                      value={formData.meta_keyword}
                      onChange={handleChange}
                      // required
                      placeholder="Enter meta Keyword"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE – MATCH HEIGHT TO LEFT SIDE */}
                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>

                  <textarea
                    id="meta_description"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    // required
                    placeholder="Enter meta description"
                    className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent md:h-full"
                  />
                </div>

              </div>
            </section>

            {/* SEO Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                SEO
              </h2>

              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-stretch">

                {/* LEFT SIDE — STACKED */}
                <div className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Canonical { }</label>
                    <input
                      id="seo_canonical"
                      name="seo_canonical"
                      type="url"
                      value={formData.seo_canonical}
                      onChange={handleCanonicalChange}
                      // required
                      placeholder="https://example.com/course/course_hash"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                        ${errors?.seo_canonical
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-leafGreen"
                        }`}
                    />
                    {errors?.seo_canonical && (
                      <p className="text-sm text-red-500 mt-1">
                        Please enter a valid URL (https://...)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Image Alt</label>
                    <input
                      id="seo_image_alt"
                      name="seo_image_alt"
                      type="text"
                      value={formData.seo_image_alt}
                      onChange={handleChange}
                      // required
                      placeholder="Enter SEO Image ALT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE – MATCH HEIGHT TO LEFT SIDE */}
                <div className="flex flex-col h-full justify-center px-4 pt-5 mt-4 md:mt-0 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-all duration-200 hover:border-leafGreen/50">
                  <div className="space-y-1 text-center w-full">
                    {seoImagePreview ? (
                      <div className="relative w-full">
                        <img
                          src={seoImagePreview}
                          alt="SEO Image"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : course?.seo_image ? (
                      <div className="relative w-full">
                        <img
                          src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.seo_image || '/placeholder.png'}`}
                          alt="SEO Image"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                    <div className="w-full flex justify-center">
                      <input
                        id="courseSEOImage"
                        name="courseSEOImage"
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="
                              block w-full max-w-sm text-sm text-gray-700
                              file:mr-4 file:px-4 file:py-2 file:border-0
                              file:bg-leafGreen file:text-white file:rounded-lg
                              file:cursor-pointer
                              cursor-pointer border border-gray-300 rounded-lg
                              overflow-hidden text-ellipsis whitespace-nowrap
                            "
                      />
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* OG Section */}
            <section className="bg-white rounded-lg shadow-sm border p-4 md:p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                OG
              </h2>

              <div className="space-y-6 w-full">

                {/* ---------- ROW 1 ---------- */}
                <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                  {/* OG Title */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Title
                    </label>
                    <input
                      id="og_title"
                      name="og_title"
                      type="text"
                      value={formData.og_title}
                      onChange={handleChange}
                      // required
                      placeholder="Enter OG Title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>

                  {/* OG Image Alt */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Image Alt
                    </label>
                    <input
                      id="og_image_alt"
                      name="og_image_alt"
                      type="text"
                      value={formData.og_image_alt}
                      onChange={handleChange}
                      // required
                      placeholder="Enter OG Image Alt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                {/* ---------- ROW 2 ---------- */}
                <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 md:items-stretch">
                  {/* OG Description */}
                  <div className="flex flex-col h-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Description
                    </label>

                    <textarea
                      id="og_description"
                      name="og_description"
                      value={formData.og_description}
                      onChange={handleChange}
                      // required
                      placeholder="Enter OG Description"
                      className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>

                  {/* OG Image Upload */}
                  <div className="flex flex-col h-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG Image
                    </label>

                    <div className="flex-1 w-full flex justify-center px-4 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-all duration-200 hover:border-leafGreen/50">
                      <div className="space-y-1 text-center w-full flex flex-col justify-center">

                        {ogImagePreview ? (
                          <img
                            src={ogImagePreview}
                            alt="OG Image"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                        ) : course?.og_image ? (
                          <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.og_image}`}
                            alt="OG Image"
                            className="mx-auto h-32 w-32 object-cover rounded-lg"
                          />
                        ) : (
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        )}

                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        <div className="w-full flex justify-center">
                          <input
                            id="courseOGImage"
                            name="courseOGImage"
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="
                              block w-full max-w-sm text-sm text-gray-700
                              file:mr-4 file:px-4 file:py-2 file:border-0
                              file:bg-leafGreen file:text-white file:rounded-lg
                              file:cursor-pointer
                              cursor-pointer border border-gray-300 rounded-lg
                              overflow-hidden text-ellipsis whitespace-nowrap
                            "
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>

          {/* Mobile Submit Button */}
          {isMobile && (
            <div className="p-4 border-t bg-white sticky bottom-0 w-full">
              <PermissionWrapper section="Course" action="edit">
                <button
                  type="submit"
                  className="w-full px-6 py-3 text-sm font-medium text-white bg-leafGreen rounded-lg   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoadingUpdateCourse}
                >
                  {isLoadingUpdateCourse ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    "Update Course"
                  )}
                </button>
              </PermissionWrapper>
            </div>
          )}
        </form>
      </main>

      {/* Media Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm" onClick={() => setPreviewModal(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-transparent" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-colors"
              onClick={() => setPreviewModal(null)}
            >
              <X size={24} />
            </button>
            {previewModal.isImage ? (
              <img src={previewModal.url} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg bg-black/10" />
            ) : (
              <video src={previewModal.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-lg bg-black" />
            )}
            <p className="mt-4 text-white text-sm font-medium bg-black bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-md">
              {previewModal.name || "Preview"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}