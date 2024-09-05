import tkinter as tk
import threading
import random
import time
from web3 import Web3, HTTPProvider
import json
import os
import subprocess
import sys
from dotenv import load_dotenv


#declare new logFIle to store the log of the temperature


class TemperatureMonitor:
    def __init__(self, root):
        load_dotenv()
        self.root = root
        self.setup_ui()
        self.setup_blockchain()

    def setup_ui(self):
        self.root.title("Temperature Monitoring")
        self.root.geometry("600x400")

        tk.Label(self.root, text="Enter Serial Number:").pack()
        self.entry_serial = tk.Entry(self.root)
        self.entry_serial.pack()

        tk.Label(self.root, text="Set Log Interval (seconds):").pack()
        self.interval = tk.IntVar(value=20)
        tk.Entry(self.root, textvariable=self.interval).pack()

        tk.Button(self.root, text="Start Monitoring", command=self.start_monitoring).pack()
        tk.Button(self.root, text="Stop Monitoring", command=self.stop_monitoring).pack()
        tk.Button(self.root, text="New Tracking Device Instance", command=self.open_new_instance).pack()
        
        #set input parameter as treshold temperature to be written from user
        tk.Label(self.root, text="Set Treshold Temperature:").pack()
        self.entry_treshold = tk.Entry(self.root)
        self.entry_treshold.pack()

    def setup_blockchain(self):
        self.blockchain_address = "HTTP://127.0.0.1:7545"
        self.web3 = Web3(HTTPProvider(self.blockchain_address))
        if not self.web3.is_connected():
            print("Failed to connect to the Ethereum client.")
            sys.exit()

        with open('./Provenance.json') as file:
            contract_json = json.load(file)

            self.contract = self.web3.eth.contract(address='0xAadc064A54720A747E7A4A08e829170B940C683a', 
                                                   abi=contract_json['abi'])
            

        self.priv_key = os.getenv('PRIVATE_KEY')
        self.pub_key = os.getenv('PUBLIC_KEY')
        if not self.priv_key or not self.pub_key:
            print("Private or public key not found in the environment variables.")
            sys.exit()

        self.last_nonce = self.get_latest_nonce()

    def get_latest_nonce(self):
        return self.web3.eth.get_transaction_count(self.web3.to_checksum_address(self.pub_key), 'pending')

    def log_temperature(self, serial_no, temperature):
        try:
            # Define maxPriorityFeePerGas and calculate maxFeePerGas
            max_priority_fee = 0
            base_fee = self.web3.eth.get_block('latest')['baseFeePerGas']
            max_fee = base_fee + max_priority_fee

            transaction = self.contract.functions.logTemperature(serial_no, temperature).build_transaction({
                'from': self.web3.to_checksum_address(self.pub_key),
                'gas': 3000000,
                'maxPriorityFeePerGas': max_priority_fee,
                'maxFeePerGas': max_fee,
                'nonce': self.get_latest_nonce()
            })
            signed_txn = self.web3.eth.account.sign_transaction(transaction, self.priv_key)
            txn_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            txn_receipt = self.web3.eth.wait_for_transaction_receipt(txn_hash)
            print('Transaction successful: RECORD_TEMP: ', txn_receipt)
            
            # Additional logic for alert on temperature threshold
            if temperature > int(self.entry_treshold.get()):
                print(f"Temperature is above threshold, sending alert to owner")
                # Build and send alert transaction
                transaction = self.contract.functions.setAlert(serial_no, 1).build_transaction({
                    'from': self.web3.to_checksum_address(self.pub_key),
                    'maxPriorityFeePerGas': max_priority_fee,
                    'maxFeePerGas': max_fee,
                    'nonce': self.get_latest_nonce()
                })
                signed_txn = self.web3.eth.account.sign_transaction(transaction, self.priv_key)
                txn_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
                txn_receipt = self.web3.eth.wait_for_transaction_receipt(txn_hash)
                print('Alert transaction successful:', txn_receipt)

            return txn_receipt
        except Exception as e:
            print('Error sending TEMPERATURE:', e)
            return None


    def monitor_temperature(self, interval):
        while self.monitoring:
            temp = random.randint(-10,-3 )
            #print into serial log file
            
            print(f"Logging temperature {temp} for serial {self.entry_serial.get()}")
            tx_receipt = self.log_temperature(self.entry_serial.get(), temp)
            if tx_receipt:
                print(f"Transaction sent. Hash: {tx_receipt.transactionHash.hex()}")
            time.sleep(interval)

    def start_monitoring(self):
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=lambda: self.monitor_temperature(self.interval.get()))
        self.monitor_thread.start()

    def stop_monitoring(self):
        self.monitoring = False
        if self.monitor_thread.is_alive():
            self.monitor_thread.join()

    def open_new_instance(self):
        subprocess.Popen([sys.executable, "./script.py"])

if __name__ == "__main__":
    root = tk.Tk()
    app = TemperatureMonitor(root)
    root.mainloop()
