
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useGetTrendingCoursesQuery } from '../../../services/Course_Management/courseApi';
import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';
import { ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const FeaturedCourses = () => {
  const [limit] = useState('all');
  const [offset] = useState(0);
  const { data: courses, isLoading, isError } = useGetTrendingCoursesQuery({ limit, offset });
  const [filteredCourses, setFilteredCourses] = useState([]);
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [swiperState, setSwiperState] = useState({
    isBeginning: true,
    isEnd: false
  });

  useEffect(() => {
    if (courses?.data) {
      // Assuming the API returns trending courses which should already be published/active
      // But we can double check status if needed. 
      // The API returns { totalCount, data: [...] } structure based on courseController
      setFilteredCourses(courses.data);
    }
  }, [courses]);

  const handleAllCoursesClick = () => navigate('/courses');

  const updateSwiperState = (swiper) => {
    setSwiperState({
      isBeginning: swiper.isBeginning,
      isEnd: swiper.isEnd
    });
    setActiveIndex(swiper.activeIndex);
    setSnapCount(swiper.snapGrid.length);
  };


  if (isLoading) {
    return (
      <div className="p-8 container bg-white">
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full transform rotate-3 absolute inset-0 opacity-50"></div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full relative animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 container bg-white">
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 font-bold mb-4">
            Failed to load courses
          </h2>
          <p className="text-gray-600">
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[1rem] overflow-hidden bg-cover bg-center bg-no-repeat relative w-full"
          style={{ backgroundImage: "url('/assets/Rectangle_background.png')" }}
        >
          <div className="flex flex-col sm:flex-row items-center p-[1rem] sm:p-[1.5rem] md:p-[2rem] lg:p-[2rem] xl:p-[2.5rem] gap-[1.5rem] sm:gap-[1rem] lg:gap-[2rem]">

            {/* Left Content */}
            <div className="w-full sm:w-[40%] md:w-[30%] lg:w-[22%] xl:w-[22%] text-white z-10 shrink-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-[0.25rem] sm:gap-[0.5rem] mb-[0.5rem] sm:mb-[1rem] text-[0.75rem] sm:text-[1rem] lg:text-[1.125rem]">
                <img src="/assets/Star.png" alt="Star" className="w-[0.875rem] h-[0.875rem] sm:w-[1.25rem] sm:h-[1.25rem] lg:w-[1.5rem] lg:h-[1.5rem]" />
                <span className="font-bold xs:text-[1.25rem] sm:text-xl 2xl:text-2xl">Trending Courses</span>
              </div>

              <h1 className="text-[1.25rem] xs:text-[1.25rem] sm:text-[1.875rem] md:text-[2.25rem] lg:text-[2.25rem] xl:text-[3rem] font-bold leading-tight mb-[0.75rem] sm:mb-[1.5rem] lg:mb-[2rem]">
                100x <br /> Capability
              </h1>

              <p className="text-[0.75rem] sm:text-[1.125rem] md:text-[1.25rem] lg:text-[1.25rem] text-gray-200 mb-[1rem] sm:mb-[1.5rem] lg:mb-[2rem] font-light">
                with <img src="/assets/Group_AI.png" alt="AI Label" className="inline-flex h-[0.875rem] sm:h-[1.25rem] lg:h-[1.5rem] align-middle" /> AI Native <br /> Curriculum
              </p>

              <div className="flex flex-col items-center sm:items-start gap-6">
                <button
                  onClick={handleAllCoursesClick}
                  className="w-fit px-[0.5rem] py-[0.25rem] xs:px-[1rem] xs:py-[0.25rem] sm:px-[1.5rem] sm:py-[0.5rem] text-[0.625rem] xs:text-[0.75rem] sm:text-base bg-white text-forestGreen rounded-[0.5rem] font-medium transition-colors duration-300"
                >
                  Explore courses
                </button>


              </div>
            </div>

            {/* Right Content - Swiper */}
            <div className="w-[85%] mx-auto sm:mx-0 sm:w-[60%] md:w-[68%] lg:w-[78%] xl:w-[78%] min-w-0">
              {filteredCourses.length === 0 ? (
                <div className="text-center py-[3rem] text-white/80">
                  <p>No courses available right now.</p>
                </div>
              ) : (
                <>
                  <Swiper
                    onSwiper={(swiper) => {
                      swiperRef.current = swiper;
                      updateSwiperState(swiper);
                    }}
                    onSlideChange={updateSwiperState}
                    onResize={updateSwiperState}
                    onBreakpoint={updateSwiperState}
                    spaceBetween={16}
                    slidesPerView={1}
                    breakpoints={{
                      640: { spaceBetween: 20, slidesPerView: 1 },
                      768: { spaceBetween: 20, slidesPerView: 2 },
                      1024: { spaceBetween: 24, slidesPerView: 2 },
                      1280: { spaceBetween: 24, slidesPerView: 3 },
                    }}
                    className="w-full cursor-grab [&_.swiper-wrapper]:!items-stretch"
                  >
                    {filteredCourses.map((course) => (
                      <SwiperSlide key={course.id} className="!h-auto !flex pb-[1.25rem]">
                        <CourseCard course={course} />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* Custom Pagination Dots */}
                  <div className="flex justify-center mt-6 gap-2">
                    {Array.from({ length: snapCount }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => swiperRef.current?.slideTo(index)}
                        className={`transition-all duration-300 rounded-full ${activeIndex === index
                          ? 'w-6 h-2 bg-white'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCourses;