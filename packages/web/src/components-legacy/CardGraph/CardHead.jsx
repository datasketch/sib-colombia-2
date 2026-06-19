import { Tooltip } from '@mui/material'
import classNames from 'classnames'

import { formatNumbers } from '../lib/functions'
import CustomTooltip from '../CustomTooltip'
import Table from '../Table'

export const CardHead = ({ title, especies, registros, datatable, link }) => {
  return (
    <>
      <span className='font-inter font-black text-4xl'>
        {formatNumbers(especies)}
        <div className='w-1/2 border-t border-t-[#262525]' />
      </span>
      <div className='text-lg font-inter font-bold relative'>
        {title}
        {datatable && datatable?.length !== 0 && <CustomTooltip placement='left-start' title={<Table tabledata={datatable} link={link}/>}>
          <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
        </CustomTooltip>}
      </div>

      <div className='flex text-sm gap-x-2 text-blue-green'>
        <p className='inline-block '><b>{formatNumbers(registros)}</b></p>
        <p className='inline-block'>Observaciones</p>
      </div>
    </>
  )
}

export const CardBody = ({ cardBody }) => {
  return (
    <div className='flex flex-col justify-center h-full'>
      <div className='font-lato flex justify-evenly gap-x-4'>
        {cardBody.map(({ title, especies, tooltip, borderColor }, key) =>
          <div key={key} className='flex flex-col items-center'>
            <div className={classNames('flex items-start border-b-2')} style={{ borderBottomColor: borderColor }}>
              <b>{title}</b>
              {tooltip && <Tooltip title={<b>{tooltip}</b>}>
                <img src='/images/icon-more.svg' />
              </Tooltip>}
            </div>
            <span>{formatNumbers(especies)}</span>
          </div>

        )}
      </div>
    </div>
  )
}
