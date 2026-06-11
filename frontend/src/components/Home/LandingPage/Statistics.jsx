import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import { useGetUserStatisticsQuery } from "../../../services/LangingPage_Management/frontendStatisticsApi"

export default function Statistics() {
  const { data: statsResponse } = useGetUserStatisticsQuery()
  const stats = statsResponse?.data || []

  const getIconUrl = (iconPath) => {
    if (!iconPath) return ""
    if (iconPath.startsWith("http")) return iconPath
    if (iconPath.startsWith("/assets/")) return iconPath
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${iconPath}`
  }

  return (
    <section className="py-2 sm:py-8 md:py-12 lg:py-10 xl:py-12 overflow-hidden">
      <div
        className="rounded-xl xs:rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[1.5rem] lg:rounded-[1.5rem] p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-14 relative overflow-hidden bg-lightGreen w-full" >
        {/* Mobile/Tablet Background Pattern */}
        <div
          className="absolute inset-0 z-0 bg-contain bg-bottom bg-no-repeat block lg:hidden"
          style={{
            backgroundImage: "url('/assets/background_number_md.png')",
          }}
        />

        {/* Desktop Background Pattern */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat hidden lg:block"
          style={{
            backgroundImage: "url('/assets/background_numbers.png')",
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="max-w-3xl mb-6 xs:mb-7 sm:mb-8 md:mb-10 lg:mb-12">
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight font-bold text-forestGreen mb-2 xs:mb-3 sm:mb-3 md:mb-4">
              Empowering Education with <br className="hidden md:block" /> Proven Results
            </h2>
            <p className="text-darkSand text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg max-w-xl sm:max-w-2xl">
              Our numbers reflect the real impact we've made on our students' lives and careers. Explore a snapshot of our journey and achievements to date.
            </p>
          </div>

          {/* Mobile Swiper (Below 768px) */}
          <div className="block sm:hidden">
            <Swiper
              modules={[Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={true}
              breakpoints={{
                375: {
                  slidesPerView: 1,
                  centeredSlides: true,
                },
                480: {
                  slidesPerView: 1,
                  centeredSlides: true,
                },
                640: {
                  slidesPerView: 1.2,
                  centeredSlides: false,
                  spaceBetween: 20,
                },
              }}
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet bg-white opacity-50',
                bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100 !bg-white'
              }}
              className="!px-1 [&_.swiper-wrapper]:!items-stretch"
            >
              {stats.map((stat, index) => (
                <SwiperSlide key={index} className="!h-auto !flex flex-col pb-8">
                  <div className="bg-forestGreen rounded-lg xs:rounded-xl p-4 xs:p-5 text-white h-full flex flex-col gap-1 flex-1 mx-2 xs:mx-3">
                    <div>
                      <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-md bg-white/20 flex items-center justify-center mb-2">
                        <img
                          src={getIconUrl(stat.icon)}
                          alt={stat.label}
                          className="w-4 h-4 xs:w-5 xs:h-5 object-contain"
                        />
                      </div>
                      <h3 className="text-base xs:text-lg font-bold mb-1">{stat.value}</h3>
                      <p className="text-xs font-light leading-tight">{stat.label}</p>
                    </div>
                    <p className="text-white text-opacity-70 text-[10px] xs:text-xs leading-tight mt-1">{stat.description}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Tablet Grid (768px - 1023px) */}
          <div className="hidden sm:block lg:hidden">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-forestGreen rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 text-white h-full flex flex-col gap-2"
                >
                  <div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md bg-white/20 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                      <img
                        src={getIconUrl(stat.icon)}
                        alt={stat.label}
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain"
                      />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{stat.value}</h3>
                    <p className="text-sm sm:text-base md:text-lg font-light leading-tight">{stat.label}</p>
                  </div>
                  <p className="text-white text-opacity-70 text-xs sm:text-sm md:text-base leading-tight mt-1">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid (>= 1024px) - Unchanged */}
          <div className="hidden lg:grid grid-cols-4 gap-4 xl:gap-6 2xl:gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-forestGreen rounded-2xl p-5 xl:p-6 2xl:p-8 text-white h-full flex flex-col gap-2"
              >
                <div>
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-md bg-white/20 flex items-center justify-center mb-4">
                    <img
                      src={getIconUrl(stat.icon)}
                      alt={stat.label}
                      className="w-8 h-8 xl:w-8 xl:h-8 object-contain"
                    />
                  </div>
                  <h3 className="text-2xl xl:text-3xl font-bold mb-2">{stat.value}</h3>
                  <p className="text-base xl:text-lg font-light leading-tight">{stat.label}</p>
                </div>
                <p className="text-white text-opacity-70 text-sm xl:text-base leading-tight">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}