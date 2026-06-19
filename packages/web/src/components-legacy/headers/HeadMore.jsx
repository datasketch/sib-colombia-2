import classNames from 'classnames'
import PropTypes from 'prop-types'
import InfoTooltip from '../InfoTooltip'
const HeadMore = ({ slug, title, description, content = false }) => {
  return (
    <>
      <div className={classNames(slug ? `bg-banner-${slug}` : 'bg-banner-mas', 'bg-cover bg-center h-80 pt-20 lg:pt-20 flex items-center text-white')}>
        <div className="w-4/5 lg:w-2/5 mx-auto text-center space-y-2">
          <span className="text-4xl lg:text-5xl font-black font-inter">{title}</span>
          {content && <>
            <div className="border-b-[1px] border-b-white w-4/5 lg:w-2/3 mx-auto" />
            <p className="font-lato text-sm">
              {description}
            </p>
          </>}
        </div>
      </div>
      <div className='-mt-12 max-w-screen-xl w-9/12 mx-auto flex justify-end'>
        <InfoTooltip id='tt-more' src='/images/camera-icon.svg' label='More Tooltip' />
      </div>
    </>
  )
}

HeadMore.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  content: PropTypes.bool,
  background: PropTypes.string
}

export default HeadMore
