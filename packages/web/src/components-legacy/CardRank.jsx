import TooltipText from './TooltipText'

const CardRank = ({ info, refs }) => {
  return (<>
    <div className='flex items-center'>
      <div className='text-4xl lg:text-5xl font-bold'>
        {info.position}
      </div>
      <div>
        <div className='text-sm lg:text-base'>{info.suffix}</div>
        <p className='capitalize text-lg lg:text-xl'>país</p>
      </div>
    </div>
    <div className='mt-0 pt-0'>
      <div className='inline-block gap-x-0.5 max-w-xs text-sm lg:text-base'>
        {(() => {
          const parts = []
          let lastIndex = 0
          const regexWithWord = /([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*\(([^)]+)\)/g
          let match

          while ((match = regexWithWord.exec(info.position_text)) !== null) {
            const [fullMatch, word, numbersString] = match
            const beforeMatch = info.position_text.slice(lastIndex, match.index)

            if (beforeMatch) {
              parts.push(beforeMatch)
            }

            // Split multiple references by pipe and clean them
            const numbers = numbersString.split('|').map(n => n.trim())

            // Find all reference data for the numbers
            const matchingRefs = numbers
              .map(number => refs.find(({ ref_id: refId }) => +refId === +number))
              .filter(Boolean) // Remove any undefined refs

            if (matchingRefs.length > 0) {
              // Combine all reference labels and content
              const combinedLabel = matchingRefs.map(ref => ref.label).join(' \n\n ')
              const combinedZotero = matchingRefs.map(ref => ref.zotero || '').filter(Boolean).join(' \n\n ')
              const reactMD = `${combinedLabel} \n\n ${combinedZotero}`

              parts.push(
                <TooltipText key={numbersString} label={word} md={reactMD} id={numbersString} />
              )
            } else {
              parts.push(fullMatch)
            }

            lastIndex = match.index + fullMatch.length
          }

          const afterLastMatch = info.position_text.slice(lastIndex)
          if (afterLastMatch) {
            parts.push(afterLastMatch)
          }

          return parts
        })()}
      </div>
    </div>

  </>)
}

export default CardRank
