import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const TestimonialCard = ({ testimonial, isSwiper = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`flex flex-col justify-between bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 h-full w-full`}
  >
    <div>
      {/* Header: Image, Name, LinkedIn */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={testimonial.src}
            alt={testimonial.name}
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => { e.currentTarget.src = '/assets/placeholder_mini.png'; }}
          />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {testimonial.name}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-tight mt-0.5">
              {testimonial.designation}
            </p>
          </div>
        </div>

        {testimonial.company_logo && (
          <img
            src={testimonial.company_logo}
            alt="Company"
            className="h-6 w-auto max-w-[80px] object-contain"
            onError={(e)=>{ e.currentTarget.src = '/assets/placeholder_mini.png';}}
          />
        )}
      </div>

      {/* Quote */}
      <p className="text-gray-900 dark:text-neutral-300 text-xs leading-relaxed mb-4">
        {testimonial.quote}
      </p>
    </div>

    {/* Stars */}
    <div className="flex gap-0.5">
      {[...Array(testimonial.rating || 5)].map((_, i) => (
        <img
          key={i}
          src="/assets/Star_5.png"
          alt="Star"
          className="h-3.5 w-3.5"
        />
      ))}
    </div>
  </motion.div >
);

export const AnimatedTestimonials = ({ testimonials = [] }) => {
  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return <p className="text-center text-gray-500">No testimonials available.</p>;
  }

  const useSwiperLayout = testimonials.length > 6;

  return (
    <section className="py-12 bg-white dark:bg-forestGreen">
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-forestGreen dark:text-white">
            What People Say About
          </h2>
          <p className="mt-4 text-gray-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Discover honest feedback from students who trust our platform for quality learning.
          </p>
        </div>

        {useSwiperLayout ? (
          <div className="relative">
            <Swiper
              modules={[Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1280: {
                  slidesPerView: 4,
                },
              }}
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet bg-forestGreen opacity-50',
                bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-forestGreen'
              }}
              className="!px-1 [&_.swiper-wrapper]:!items-stretch cursor-grab"
            >
              {testimonials.map((testimonial, index) => (
                <SwiperSlide key={index} className="!h-auto !flex flex-col pb-10">
                  <TestimonialCard testimonial={testimonial} isSwiper={true} />
                </SwiperSlide>
              ))}
            </Swiper>
            <style jsx global>{`
                .swiper-pagination {
                  bottom: 0px !important;
                }
                .swiper-pagination-bullet {
                  width: 8px;
                  height: 8px;
                  background-color: #2D6A4F;
                  opacity: 0.5;
                  transition: all 0.3s;
                }
                .swiper-pagination-bullet-active {
                  width: 24px;
                  border-radius: 4px;
                  background-color: #2D6A4F;
                  opacity: 1;
                }
              `}</style>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Swiper View (< lg) */}
            <div className="block lg:hidden">
              <Swiper
                modules={[Pagination]}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                  }
                }}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet bg-forestGreen opacity-50',
                  bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-forestGreen'
                }}
                className="!px-1 [&_.swiper-wrapper]:!items-stretch"
              >
                {testimonials.map((testimonial, index) => (
                  <SwiperSlide key={index} className="!h-auto !flex flex-col pb-10">
                    <TestimonialCard testimonial={testimonial} isSwiper={true} />
                  </SwiperSlide>
                ))}
              </Swiper>
              <style jsx global>{`
                  .swiper-pagination {
                    bottom: 0px !important;
                  }
                  .swiper-pagination-bullet {
                    width: 8px;
                    height: 8px;
                    background-color: #2D6A4F; /* forestGreen */
                    opacity: 0.5;
                    transition: all 0.3s;
                  }
                  .swiper-pagination-bullet-active {
                    width: 24px;
                    border-radius: 4px;
                    background-color: #2D6A4F;
                    opacity: 1;
                  }
                `}</style>
            </div>


            {/* Desktop Grid View (>= lg) - Original Layout Preserved */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((colIndex) => (
                <div key={colIndex} className="flex flex-col gap-6 h-full">
                  {[0, 1].map((rowIndex) => {
                    const testimonialIndex = colIndex + rowIndex * 3;
                    const testimonial = testimonials[testimonialIndex];
                    if (!testimonial) return null;

                    return (
                      <div key={testimonialIndex} className={rowIndex === 1 ? "flex-1" : ""}>
                        <TestimonialCard testimonial={testimonial} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
