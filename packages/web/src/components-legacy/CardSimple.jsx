import { formatNumbers } from './lib/functions'
import CustomTooltip from './CustomTooltip'
import Table from './Table'

const CardSimple = ({ title, especies, registros, datatable, style, link }) => {
  if (style === 1) {
    return (
      <div className='space-y-2 shadow-md flex flex-col justify-start py-6 px-4'>
        <span className='font-inter font-black text-4xl '>
          {formatNumbers(especies)}
          <div className='w-1/2 border-t border-t-[#262525]' />
        </span>

        <div className='text-lg font-inter font-bold'>
          {title}
          {datatable && datatable?.length !== 0 && <CustomTooltip title={<Table tabledata={datatable} link={link}/>}>
            <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
          </CustomTooltip>}

        </div>
        <div className='flex text-sm gap-x-2 text-blue-green'>
          <p className='inline-block '><b>{formatNumbers(registros)}</b></p>
          <p className='inline-block'>Observaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex px-1.5 py-0.5 gap-2 items-center shadow-default'>
      <div className='font-black font-inter'> {formatNumbers(especies)}</div>
      <div className='text-xs font-lato'>{title}</div>
    </div>
  )
}

export default CardSimple
