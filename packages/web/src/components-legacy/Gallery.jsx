import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import classNames from 'classnames'
import InfoTooltip from './InfoTooltip'

const Gallery = ({ gallery }) => {
  if (!gallery) return

  // Check if we have the new format (objects with text, image, and credit together)
  const hasNewFormat = gallery.length > 0 && gallery[0].text && gallery[0].image && gallery[0].credit

  if (hasNewFormat) {
    // New format: Chess-like pattern with alternating text and images
    const items = []

    gallery.forEach(({ text, image, credit }, index) => {
      if (index >= 6) return // Limit to 6 pairs (12 items total)

      // For each gallery item, create both text and image elements
      const textElement = (
        <div key={`text-${index}`} className='flex bg-white-2 justify-center items-center min-h-[10rem] h-full p-4'>
          <ReactMarkdown rehypePlugins={[rehypeRaw]} className='text-sm lg:text-base font-lato text-center'>
            {text}
          </ReactMarkdown>
        </div>
      )

      const imageElement = (
        <div key={`image-${index}`} className='relative'>
          <img className="min-h-[10rem] min-w-[10rem] w-full h-full object-cover" src={image} alt="" />
          <div className='absolute bottom-1 right-1'>
            <InfoTooltip src='/images/camera-icon.svg' id={'g-' + index} label={credit} />
          </div>
        </div>
      )

      // Add items in chess pattern: even rows start with text, odd rows start with image
      const rowIndex = Math.floor(items.length / 4)
      const isEvenRow = rowIndex % 2 === 0

      if (isEvenRow) {
        items.push(textElement, imageElement)
      } else {
        items.push(imageElement, textElement)
      }
    })

    return (
      <div className='py-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-screen-xl mx-auto w-10/12'>
        {items}
      </div>
    )
  }

  // Old format: 5 columns grid with separate text and image objects
  return (
    <div className='py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 max-w-screen-xl mx-auto w-10/12'>
      {gallery.map(({ text, image, id, ref }, key) => {
        if (key >= 15) return null
        if (text) {
          return (
            <div key={key} className={classNames('flex bg-white-2 justify-center items-center min-h-[9rem] h-full'/* , [2, 7, 12, 17, 22, 27].includes(key) ? 'col-span-2' : '' */)}>
              <ReactMarkdown rehypePlugins={[rehypeRaw]} className='w-5/6 text-sm lg:text-base font-lato '>
                {text}
              </ReactMarkdown>
            </div>
          )
        }
        if (image) {
          return (
            <div key={key} className='relative'>
              <img className="min-h-[10rem] min-w-[10rem] w-full h-full " src={image} />
              <div className='absolute bottom-1 right-1'>
                <InfoTooltip src='/images/camera-icon.svg' id={'g-' + +id} label={'gallery tooltip'}/>
              </div>
            </div>
          )
        }
        return null
      }
      )}
    </div>
  )
}

export default Gallery
