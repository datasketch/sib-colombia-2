import classNames from 'classnames'
import { formatNumbers } from './lib/functions'

export default function PublishersCard ({ truncate = false, country, title, observationsQuantity, totalEspecies, imagePath, link }) {
  return (
    <div className='bg-white flex flex-col justify-between text-black-2 py-3 px-4 w-auto gap-y-2 shadow-default hover:shadow-select'>
      <div className="flex items-end justify-between">
        <p className='text-sm italic'>
          País de publicación: {country}
        </p>
        <img className='w-14 h-14 break-words' src={imagePath} alt={`${title} image`} />
      </div>
      <div title={title} className={classNames('font-lato  font-bold text-[15px] 3xl:text-lg w-auto mt-1', truncate && 'truncate')}>
        <a href={link || '#'} target='_blank' rel="noreferrer">{title}</a>
      </div>
      <div className='flex flex-col w-auto justify-between gap-y-2'>
        <table className='w-full '>
          <tbody>
            <tr className="text-sm">
              <th className="text-left bg-gray-2">Observaciones</th>
              <th className="pl-3 border-l border-l-black bg-gray-2">
                <b>{formatNumbers(observationsQuantity)}</b>
              </th>
            </tr>
            <tr className="text-sm">
              <th className="text-left">Especies</th>
              <th className="pl-3 border-l border-l-black">
                <b>{formatNumbers(totalEspecies)}</b>
              </th>
            </tr>
          </tbody>
        </table>
      </div>
      {/* <div className="flex justify-end items-end mt-3">
        <a href={link || '#'} className="flex  gap-x-1.5 w-4/6 border border-black px-1.5 py-1 rounded-full justify-center h-full">
          <span className="text-sm">Conocer más</span>
          <img src="/images/icon-arrow-left.svg" />
        </a>
      </div> */}
    </div>
  )
}
