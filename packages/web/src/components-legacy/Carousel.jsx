import React, { useRef } from 'react'

// import Swiper core and required modules
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export const Carousel = ({ children, navigation = false, pagination = false, slidesPerView = 1, responsive = false, spaceBetween = 50, classNames = '' }) => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={spaceBetween}
      onInit={(swiper) => {
        swiper.params.navigation.prevEl = prevRef.current
        swiper.params.navigation.nextEl = nextRef.current
        swiper.navigation.init()
        swiper.navigation.update()
      }}
      navigation={navigation &&
      {
        disabledClass: 'opacity-40'
      }}
      pagination={pagination && { clickable: true }}
      slidesPerView={!responsive && slidesPerView}
      breakpoints={responsive &&
      {
        // when window width is >= 0
        0: {
          slidesPerView: 1,
          spaceBetween: 10
        },
        // when window width is >= 768px
        768: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        // when window width is >= 1024
        1024: {
          slidesPerView: 3,
          spaceBetween: 30
        },
        // when window width is >= 1024
        1280: {
          slidesPerView: 4,
          spaceBetween: 40
        },
        // when window width is >= 1920
        1920: {
          slidesPerView,
          spaceBetween
        }
      }}
    >
      {React.Children.map(children, child => (
        <SwiperSlide className={classNames}>{child}</SwiperSlide>
      ))}
      {/* CUSTOM BUTTON */}
      {/* <div className='z-20'>
        <button ref={prevRef} className="cursor-pointer absolute left-0">
          <img src="/images/swiper-arrow-left.svg" alt="swiper arrow left" />
        </button>
        <button ref={nextRef} className="cursor-pointer absolute right-0">
          <img src="/images//images/swiper-arrow-right.svg" alt="swiper arrow right" />
        </button>
      </div> */}
    </Swiper>
  )
}

const Item = ({ children }) => {
  return <>{children}</>
}
Carousel.Item = Item
