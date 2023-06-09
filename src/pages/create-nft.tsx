/* eslint-disable jsx-a11y/alt-text */
import { useState } from 'react'
import { ethers } from 'ethers'
import { Web3Storage } from "web3.storage";
import Web3Modal from 'web3modal'
import styles from "./css/createnft.module.css"

import {
    marketplaceAddress
} from '../config'

import NFTMarketplace from '../contracts/NFTMarketplace.sol/NFTMarketplace.json'
import React from 'react';

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState<any>()
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })

    async function onChange(e: any) {
        const file = new File([e.target.files[0]], "image.jpg", {
            type: e.target.files[0].type,
        })
        try {
            const token = process.env.REACT_APP_WEB3STORAGE_TOKEN;
            // console.log("THE TOKEN ----------->>>>", token);
            if (!token) {
                return console.error(
                    "A token is needed. You can create one on https://web3.storage"
                );
            }

            const storage = new Web3Storage({ token });
            const cid = await storage.put([file], {
                name: "image",
            });
            const url = "https://" +
                cid +
                ".ipfs.w3s.link/" +
                "image.jpg"
            console.log(url)
            setFileUrl(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }
    async function uploadToW3St() {
        const { name, description, price } = formInput
        if (!name || !description || !price || !fileUrl) return
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        const file = new File([blob], 'nft.json')
        try {
            const token = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN;
            // console.log("THE TOKEN ----------->>>>", token);
            if (!token) {
                return console.error(
                    "A token is needed. You can create one on https://web3.storage"
                );
            }

            const storage = new Web3Storage({ token });
            const cid = await storage.put([file], {
                name: "nft",
            });

            const url = "https://" +
                cid +
                ".ipfs.w3s.link/" +
                "nft.json"
            /* after file is uploaded to IPFS, return the URL to use it in the transaction */
            console.log(url)
            return url
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    async function listNFTForSale() {
        const url = await uploadToW3St()
        console.log(url)
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        /* next, create the item */
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()
        let transaction = await contract.createToken(url, price, { value: listingPrice })
        await transaction.wait()

        // ROUTE TO ANOTHER PAGE
    }

    return (
        <div className={`${styles.flex} ${styles.justifycenter}`}>
            <div className={`${styles['w-1']} ${styles['flex-col']} ${styles['pb-12']}`}>
                <input
                    placeholder="Asset Name"
                    className={`${styles.border} ${styles.rounded} ${styles.p4} ${styles['mt-8']}`}
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="Asset Description"
                    className={`${styles.border} ${styles.rounded} ${styles.p4} ${styles['mt-2']}`}
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in Eth"
                    className={`${styles.border} ${styles.rounded} ${styles.p4} ${styles['mt-2']}`}
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className={`${styles.my4}`}
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className={`${styles.rounded} ${styles.mt4}`} width="350" src={fileUrl} />
                    )
                }
                <button onClick={listNFTForSale} className={`${styles['font-bold']} ${styles['bg-pink-500']} ${styles['text-white']} ${styles.rounded} ${styles.p4} ${styles['shadow-lg']} ${styles['mt-4']}`}>
                    Create NFT
                </button>
            </div>
        </div>

    )
}