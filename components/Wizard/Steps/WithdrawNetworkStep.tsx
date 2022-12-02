import { SwitchHorizontalIcon } from '@heroicons/react/outline';
import { CheckIcon, HomeIcon, ChatIcon, XIcon } from '@heroicons/react/solid';
import { FC, useCallback, useEffect, useState } from 'react'
import { useSwapDataState, useSwapDataUpdate } from '../../../context/swap';
import SubmitButton, { DoubleLineText } from '../../buttons/submitButton';
import { useFormWizardaUpdate } from '../../../context/formWizardProvider';
import { SwapWithdrawalStep } from '../../../Models/Wizard';
import { useSettingsState } from '../../../context/settings';
import { useIntercom } from 'react-use-intercom';
import { useAuthState } from '../../../context/authContext';
import BackgroundField from '../../backgroundField';
import WarningMessage from '../../WarningMessage';
import NetworkSettings from '../../../lib/NetworkSettings';
import KnownInternalNames from '../../../lib/knownIds';
import { GetSwapStatusStep } from '../../utils/SwapStatus';
import GoHomeButton from '../../utils/GoHome';
import Widget from '../Widget';
import Modal from '../../modalComponent';
import { useGoHome } from '../../../hooks/useGoHome';
import toast from 'react-hot-toast';
import GuideLink from '../../guideLink';

const WithdrawNetworkStep: FC = () => {
    const [transferDone, setTransferDone] = useState(false)
    const { networks, discovery: { resource_storage_url } } = useSettingsState()
    const { goToStep } = useFormWizardaUpdate<SwapWithdrawalStep>()
    const { email, userId } = useAuthState()
    const [loadingSwapCancel, setLoadingSwapCancel] = useState(false)
    const { boot, show, update } = useIntercom()
    const updateWithProps = () => update({ email: email, userId: userId, customAttributes: { swapId: swap?.id } })
    const { swap } = useSwapDataState()
    const { setInterval, cancelSwap } = useSwapDataUpdate()
    const goHome = useGoHome()

    useEffect(() => {
        setInterval(2000)
        return () => setInterval(0)
    }, [])

    const swapStatusStep = GetSwapStatusStep(swap)

    useEffect(() => {
        if (swapStatusStep && swapStatusStep !== SwapWithdrawalStep.OffRampWithdrawal)
            goToStep(swapStatusStep)
    }, [swapStatusStep])

    const handleTransferDone = useCallback(async () => {
        setTransferDone(true)
    }, [])

    const network = networks?.find(n => n.currencies.some(nc => nc.id === swap?.network_currency_id))
    const currency = network?.currencies.find(n => n.id === swap?.network_currency_id)

    const network_name = network?.display_name || ' '
    const network_logo_url = network?.logo
    const network_internal_name = network?.internal_name

    const [openCancelConfirmModal, setOpenCancelConfirmModal] = useState(false)
    const handleClose = () => {
        setOpenCancelConfirmModal(false)
    }

    const handleCancelConfirmed = useCallback(async () => {
        setLoadingSwapCancel(true)
        try {
            await cancelSwap(swap.id)
            setLoadingSwapCancel(false)
            await goHome()
        }
        catch (e) {
            setLoadingSwapCancel(false)
            toast(e.message)
        }
    }, [swap])

    const handleOpenModal = () => {
        setOpenCancelConfirmModal(true)
    }

    if (!swap?.additonal_data) {
        return null;
    }

    const userGuideUrlForDesktop = NetworkSettings.KnownSettings[network?.internal_name]?.UserGuideUrlForDesktop

    return (
        <>
            <Widget>
                <Widget.Content>
                    <div className="w-full space-y-5 flex flex-col justify-between h-full text-primary-text">
                        <div className='space-y-4'>
                            <div className="text-left">
                                <p className="block text-md sm:text-lg font-medium text-white">
                                    Send crypto to the provided address
                                </p>
                                <p className='text-sm sm:text-base'>
                                    The swap will be completed after the transfer is detected
                                </p>
                            </div>
                            {
                                swap?.additonal_data?.memo &&
                                <WarningMessage>
                                    Please include the "Memo" field, it is required for a successful transfer.
                                </WarningMessage>
                            }
                            <div className='mb-6 grid grid-cols-1 gap-4'>
                                {
                                    network_internal_name === KnownInternalNames.Networks.LoopringMainnet &&
                                    <BackgroundField header={'Send type'}>
                                        <div className='flex items-center space-x-2'>
                                            <SwitchHorizontalIcon className='h-4 w-4' />
                                            <p>
                                                To Another Loopring L2 Account
                                            </p>
                                        </div>
                                    </BackgroundField>
                                }
                                <BackgroundField isCopiable={true} isQRable={true} toCopy={swap?.additonal_data?.deposit_address} header={'Recipient'}>
                                    <p className='break-all'>
                                        {swap?.additonal_data?.deposit_address}
                                    </p>
                                </BackgroundField>

                                <div className='flex space-x-4'>
                                    <BackgroundField header={'Address Type'}>
                                        <p>
                                            EOA Wallet
                                        </p>
                                    </BackgroundField>
                                    {
                                        swap?.additonal_data?.memo &&
                                        <>
                                            <BackgroundField isCopiable={true} toCopy={swap?.additonal_data?.memo} header={'Memo'}>
                                                <p className='break-all'>
                                                    {swap?.additonal_data?.memo}
                                                </p>
                                            </BackgroundField>
                                        </>
                                    }
                                </div>
                                <div className='flex space-x-4'>
                                    <BackgroundField isCopiable={true} toCopy={swap?.requested_amount} header={'Amount'}>
                                        <p>
                                            {swap?.requested_amount}
                                        </p>
                                    </BackgroundField>
                                    <BackgroundField header={'Asset'}>
                                        <p>
                                            {currency?.asset}
                                        </p>
                                    </BackgroundField>
                                </div>
                                {
                                    userGuideUrlForDesktop &&
                                    <WarningMessage messageType='informing'>
                                        <span className='flex-none'>
                                            Learn how to send from
                                        </span>
                                        <GuideLink text='Loopring Web' userGuideUrl={userGuideUrlForDesktop} place="inStep"></GuideLink>
                                    </WarningMessage>
                                }
                            </div>
                        </div>
                    </div>
                </Widget.Content>
                <Widget.Footer>
                    <div className="flex text-center mb-4 space-x-2">
                        <div className='relative'>
                            <div className='absolute top-1 left-1 w-4 h-4 md:w-5 md:h-5 opacity-40 bg bg-primary rounded-full animate-ping'></div>
                            <div className='absolute top-2 left-2 w-2 h-2 md:w-3 md:h-3 opacity-40 bg bg-primary rounded-full animate-ping'></div>
                            <div className='relative top-0 left-0 w-6 h-6 md:w-7 md:h-7 scale-50 bg bg-primary rounded-full '></div>
                        </div>
                        <label className="text-xs self-center md:text-sm sm:font-semibold text-primary-text">Waiting for you to do a withdrawal from the exchange</label>
                    </div>
                    {
                        transferDone ?
                            <div>
                                <div className="flex flex-row text-white text-base space-x-2">
                                    <div className='basis-1/3'>
                                        <SubmitButton onClick={() => {
                                            boot();
                                            show();
                                            updateWithProps()
                                        }} isDisabled={false} isSubmitting={false} text_align="left" buttonStyle='outline' icon={<ChatIcon className="h-5 w-5" aria-hidden="true" />}>
                                            <DoubleLineText
                                                colorStyle='mltln-text-dark'
                                                primaryText='Support'
                                                secondarytext='Contact'
                                            />
                                        </SubmitButton>
                                    </div>
                                    <div className='basis-2/3'>
                                        <GoHomeButton>
                                            <SubmitButton button_align='right' text_align='left' isDisabled={false} isSubmitting={false} buttonStyle='outline' icon={<HomeIcon className="h-5 w-5" aria-hidden="true" />}>
                                                <DoubleLineText
                                                    colorStyle='mltln-text-dark'
                                                    primaryText='Swap'
                                                    secondarytext='Do another'
                                                />
                                            </SubmitButton>
                                        </GoHomeButton>
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="flex flex-row text-white text-base space-x-2">
                                <div className='basis-1/3'>
                                    <SubmitButton onClick={handleOpenModal} text_align='left' isDisabled={false} isSubmitting={false} buttonStyle='outline' icon={<XIcon className='h-5 w-5' />}>
                                        <DoubleLineText
                                            colorStyle='mltln-text-dark'
                                            primaryText='Cancel'
                                            secondarytext='the swap'
                                            reversed={true}
                                        />
                                    </SubmitButton>
                                </div>
                                <div className='basis-2/3'>
                                    <SubmitButton button_align='right' text_align='left' isDisabled={false} isSubmitting={false} onClick={handleTransferDone} icon={<CheckIcon className="h-5 w-5" aria-hidden="true" />} >
                                        <DoubleLineText
                                            colorStyle='mltln-text-light'
                                            primaryText='I did'
                                            secondarytext='the transfer'
                                            reversed={true}
                                        />
                                    </SubmitButton>
                                </div>
                            </div>
                    }
                </Widget.Footer>
            </Widget>
            <Modal showModal={openCancelConfirmModal} setShowModal={handleClose} title="Do NOT cancel if you have already sent crypto" modalSize='medium'>
                <div className='text-primary-text mb-4'></div>
                <div className="flex flex-row text-white text-base space-x-2">
                    <div className='basis-1/2'>
                        <SubmitButton text_align='left' isDisabled={loadingSwapCancel} isSubmitting={loadingSwapCancel} onClick={handleCancelConfirmed} buttonStyle='outline' size="medium" >
                            <DoubleLineText
                                colorStyle='mltln-text-dark'
                                primaryText='Cancel the swap'
                                secondarytext='and go to home'
                                reversed={true}
                            />
                        </SubmitButton>
                    </div>
                    <div className='basis-1/2'>
                        <SubmitButton button_align='right' text_align='left' isDisabled={loadingSwapCancel} isSubmitting={false} onClick={handleClose} size='medium'>
                            <DoubleLineText
                                colorStyle='mltln-text-light'
                                primaryText="Don't"
                                secondarytext='cancel'
                                reversed={true}
                            />
                        </SubmitButton>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default WithdrawNetworkStep;
