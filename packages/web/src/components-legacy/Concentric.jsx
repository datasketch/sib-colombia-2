import classNames from 'classnames'
import { scaleLinear } from 'd3-scale'

export default function Concentric ({ outer, inner, style = 'style-1', movil = false }) {
  const radius = style === 'style-2' ? 28000 : movil ? 15000 : 25000
  const radiusScale = scaleLinear().domain([0, outer]).range([0, radius])

  const outerStyle = (style) => {
    if (style === 'style-2') {
      return {
        width: `${Math.sqrt(radius)}px`,
        height: `${Math.sqrt(radius)}px`,
        borderRadius: '50%',
        border: '1px solid black',
        position: 'relative',
        backgroundColor: '#FFE0BB'
      }
    }
    return {
      width: `${Math.sqrt(radius)}px`,
      height: `${Math.sqrt(radius)}px`,
      borderRadius: '50%',
      border: '1px solid white',
      position: 'relative'
    }
  }

  const innerStyle = (style) => {
    if (style === 'style-2') {
      return {
        width: `${Math.sqrt(radiusScale(inner))}px`,
        height: `${Math.sqrt(radiusScale(inner))}px`,
        borderRadius: '50%',
        // border: '1px solid black',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#5151F2'
      }
    }
    return {
      width: `${Math.sqrt(radiusScale(inner))}px`,
      height: `${Math.sqrt(radiusScale(inner))}px`,
      borderRadius: '50%',
      border: '1px solid white',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#C2F284'
    }
  }

  return (

    <div className='relative' style={outerStyle(style)}>
      <img className={classNames('absolute', style === 'style-2' ? 'top-1/2 left-[78px] h-28' : ' -top-[5.5%] left-1/2')} src={style === 'style-2' ? '/images/outer-arrow-black.svg' : '/images/external-arrow.svg'} />
      <img className={classNames('absolute', style === 'style-2' ? 'top-1/2 -left-1.5' : ' top-[45%] left-1/2')} src={style === 'style-2' ? '/images/inner-arrow-black.svg' : '/images/external-arrow.svg'} />
      <div style={innerStyle(style)}>
      </div>
    </div>
  )
}
