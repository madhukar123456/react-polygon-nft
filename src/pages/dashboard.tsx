/* eslint-disable jsx-a11y/alt-text */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import styles from "./css/dashboard.module.css"

import {
    marketplaceAddress
} from '../config'

import NFTMarketplace from '../contracts/NFTMarketplace.sol/NFTMarketplace.json'
import React from 'react'

export default function CreatorDashboard() {
    const [nfts, setNfts] = useState<any>([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNFTs()
    }, [])
    async function loadNFTs() {
        const web3Modal = new Web3Modal({
            network: 'mainnet',
            cacheProvider: true,
        })
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
        const data = await contract.fetchItemsListed()
        console.log(data)

        const items = await Promise.all(data.map(async (i: { tokenId: { toNumber: () => any }; price: { toString: () => ethers.BigNumberish }; seller: any; owner: any }) => {
            const tokenUri = await contract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            const metadata = JSON.parse(meta.data)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: metadata.image,
            }
            return item
        }))

        setNfts(items)
        setLoadingState('loaded')
    }
    if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFTs listed</h1>)
    return (
        <div className={styles.container}>
            <h2 className={`${styles.title} text-2xl py-2`}>Items Listed</h2>
            <div className={styles.grid}>
                {nfts.map((nft: any, i: any) => (
                    <div key={i} className={styles.card}>
                        <img src={nft.image} className="rounded" />
                        <div className={styles.price}>
                            <p>Price - {nft.price} Eth</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    )
}