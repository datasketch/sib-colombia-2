import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

function SamplePrevArrow (props) {
  const { className, style, onClick, imagePath } = props
  return (
    <button className={`${className || ''} cursor-pointer`}
      style={{ ...style, left: '-50px', width: '32px', height: '30px' }}
      onClick={onClick}>
      <img src={imagePath} />
    </button>
  )
}

function SampleNextArrow (props) {
  const { className, style, onClick, imagePath } = props
  return (
    <button className={`${className || ''} cursor-pointer`}
      style={{ ...style, right: '-50px', width: '32px', height: '30px' }}
      onClick={onClick}>
      <img src={imagePath} />
    </button>
  )
}

export default function SimpleSlider (props) {
  const { children, dots = false, infinite = false, slidestoshow: slidesToShow = 1, slidesToScroll = 1, responsiveSlidesToShow } = props
  const buttonImage = {
    prevButton: '/images/arrow-left-carousel.svg',
    nextButton: '/images/arrow-right-carousel.svg'
  }

  const settings = {
    dots,
    nextArrow: <SampleNextArrow imagePath={buttonImage.nextButton} />,
    prevArrow: <SamplePrevArrow imagePath={buttonImage.prevButton} />,
    infinite,
    speed: 500,
    slidesToShow,
    slidesToScroll,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: responsiveSlidesToShow || 2,
          slidesToScroll: 1,
          initialSlide: 0,
          infinite
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: responsiveSlidesToShow || 3,
          slidesToScroll: 1,
          infinite
        }
      }
    ]
  }

  return (
    <Slider {...settings}>
      {children}
    </Slider >
  )
}

// export { SimpleSlider }

// const buttonColorImagePath = {
//   dark: {
//     prevButton: '/images/arrow-left-carousel.svg',
//     nextButton: '/images/arrow-right-carousel.svg'
//   },
//   light: {
//     prevButton: '/images/swiper-arrow-left-light.svg',
//     nextButton: '/images/swiper-arrow-right-light.svg'
//   }
// }
// const settings = {
//   infinite,
//   speed: 500,
//   nextArrow: <SampleNextArrow imagePath={buttonImage.nextButton} />,
//   prevArrow: <SamplePrevArrow imagePath={buttonImage.prevButton} />,
// }
