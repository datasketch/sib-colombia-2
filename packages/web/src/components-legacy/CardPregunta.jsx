import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

const CardPregunta = ({ title, description, date, index }) => {
  return (
    <div className="space-y-2">
      <div className="flex font-inter font-black space-x-3">
        <span>{index}.</span>
        <h2 >{title}</h2>
      </div>
      <div className="px-7 font-lato space-y-1.5">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]} linkTarget='_blank' className='rc-markdown'>{description}</ReactMarkdown>
        <div className=" w-1/6 border-b-2 border-b-flame border-dotted" />
      {date && <div className="space-x-1.5 text-sm">
          <span className='italic'>Ultima actualización:</span>
          <b>{date}</b>
        </div>}
      </div>

    </div>
  )
}

export default CardPregunta
