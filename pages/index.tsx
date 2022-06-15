import Swap from '../components/swapComponent'
import Layout from '../components/layout'
import LayerSwapApiClient from '../lib/layerSwapApiClient'
import { InferGetServerSidePropsType } from 'next'
import { CryptoNetwork } from '../Models/CryptoNetwork'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useEffect, useState } from 'react'
import NavRadio, { NavRadioOption } from '../components/navRadio'
import Banner from '../components/banner'
import { SettingsProvider } from '../context/settings'
import { QueryProvider } from '../context/query'
import { AccountProvider } from '../context/account'


const swapOptions: NavRadioOption[] = [
  { name: "onramp", displayName: 'On-ramp', isEnabled: true, isNew: false },
  { name: "offramp", displayName: 'Off-ramp', isEnabled: true, isNew: true }
];

export default function Home({ data, query, isOfframpEnabled }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { activate, active, account, chainId } = useWeb3React<Web3Provider>();

  let preSelectedNetwork: string = query.destNetwork;
  let lockNetwork: boolean = query.lockNetwork;
  let preSelectedAddress: string = query.destAddress;
  let lockAddress: boolean = query.lockAddress;

  const [addressSource, setAddressSource] = useState(query.addressSource);

  

  if (chainId) {
    let network = data.networks.find(x => x.chain_id == chainId);
    if (network) {
      preSelectedNetwork = network.code;
      lockNetwork = true;
    }
  }

  if (account) {
    preSelectedAddress = account;
    lockAddress = true;
  }

  const [swapOption, setSwapOption] = useState(swapOptions[0]);
  const [isShowing, setIsShowing] = useState(false)

  return (
    <Layout>
      <div className='flex flex-col space-y-5'>
        <div className='flex flex-col items-center'>
          {
            isOfframpEnabled &&
            <NavRadio selected={swapOption} items={swapOptions} setSelected={setSwapOption}></NavRadio>
          }
          {swapOption.name === "offramp"
            &&
            <div className='flex w-full'>
              <Banner className='mt-2' localStorageId='WarningBetaProduct' desktopMessage='WARNING! Beta product, please use at your own risk' mobileMessage='WARNING! Beta product'></Banner>
            </div>
          }
        </div>
{/* 
        <SettingsProvider data={data}>
          <QueryProvider query={query}>
            <AccountProvider data={{ account, chainId }}> */}
              <Swap swapMode={swapOption.name} destNetwork={preSelectedNetwork} destAddress={preSelectedAddress} lockAddress={lockAddress} lockNetwork={lockNetwork} addressSource={addressSource} sourceExchangeName={query.sourceExchangeName} asset={query.asset} />
            {/* </AccountProvider>
          </QueryProvider>
        </SettingsProvider> */}
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  context.res.setHeader(
    'Cache-Control',
    's-maxage=60, stale-while-revalidate'
  );

  var query = context.query;
  var apiClient = new LayerSwapApiClient();
  const data = await apiClient.fetchSettingsAsync()
  var networks: CryptoNetwork[] = [];
  if (!process.env.IS_TESTING) {
    data.networks.forEach((element) => {
      if (!element.is_test_net) networks.push(element);
    });
  }
  else {
    networks = data.networks;
  }

  data.networks = networks;
  let isOfframpEnabled = process.env.OFFRAMP_ENABLED != undefined && process.env.OFFRAMP_ENABLED == "true";

  return {
    props: { data, query, isOfframpEnabled },
  }
}
